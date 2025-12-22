from datetime import date, datetime, time
from logging import getLogger
from typing import Optional, List
from sqlmodel import Session, select
from models import Challenge, DailyChallengeMetrics, LoggedActivity

logger = getLogger(__name__)

def update_challenge_progress(
    db: Session, 
    user_id: str, 
    activity: LoggedActivity, 
    category_name: Optional[str] = None
):
    """
    Updates the daily challenge metrics based on a newly logged activity.
    Matches activity category or name against challenge commitments.
    """
    try:
        # 1. Get Active Challenge
        statement = select(Challenge).where(Challenge.user_id == user_id).where(Challenge.status == "active")
        challenge = db.exec(statement).first()
        if not challenge:
            return None # No active challenge
        
        # 2. Get/Create Metrics for Effective Date
        # Use effective_date (psychological day)
        effective_date = activity.effective_date or date.today()
        
        # Don't track before start or after end
        if effective_date < challenge.start_date or effective_date > challenge.end_date:
            return None
            
        metrics_query = select(DailyChallengeMetrics).where(
            DailyChallengeMetrics.challenge_id == challenge.id,
            DailyChallengeMetrics.date == effective_date
        )
        metrics = db.exec(metrics_query).first()
        
        if not metrics:
            # Initialize new metrics
            day_num = (effective_date - challenge.start_date).days + 1
            metrics = DailyChallengeMetrics(
                challenge_id=challenge.id,
                date=effective_date,
                day_number=day_num,
                commitments_status={}
            )
            db.add(metrics)
            # We need to commit/flush to ensure we have an object we can modify safely? 
            # Actually just adding it to session is enough for modification, but ID generation happens on flush.
        
        # 3. Process Commitments
        # commitments is likely a list of dicts: [{id, habit, target, unit, category, ...}]
        commitments = challenge.commitments or []
        
        # Identify current status map
        # Structure: { commitment_id: { achieved: number, completed: bool, ... } }
        current_status = dict(metrics.commitments_status) if metrics.commitments_status else {}
        
        updated = False
        
        for comm in commitments:
            c_id = comm.get("id")
            if not c_id: continue
            
            c_category = comm.get("category")
            c_habit = comm.get("habit")
            c_unit = comm.get("unit")
            c_target = comm.get("target") 
            
            # MATCHING LOGIC
            is_match = False
            
            # Match by Category (Primary)
            if c_category and category_name and c_category.lower() == category_name.lower():
                is_match = True
            # Match by Habit Name (Secondary - substring match)
            elif c_habit and activity.activity_name and c_habit.lower() in activity.activity_name.lower():
                is_match = True
                
            if is_match:
                print(f"[ChallengeTracker] Activity '{activity.activity_name}' matched commitment '{c_habit}'")
                
                # Calculate contribution
                duration_min = calculate_duration_minutes(activity.start_time, activity.end_time)
                duration_hours = duration_min / 60.0
                
                # Get existing entry or init
                status_entry = current_status.get(c_id, {
                    "achieved": 0,
                    "target": c_target,
                    "unit": c_unit,
                    "completed": False
                })
                
                # Accrue progress
                if c_unit == "hours":
                    status_entry["achieved"] = float(status_entry.get("achieved", 0)) + duration_hours
                elif c_unit == "minutes":
                    status_entry["achieved"] = float(status_entry.get("achieved", 0)) + duration_min
                else: 
                    # Default/Binary
                    status_entry["achieved"] = 1
                    status_entry["completed"] = True
                    
                # Check completion
                if c_unit in ["hours", "minutes"] and c_target:
                    if status_entry["achieved"] >= float(c_target):
                        status_entry["completed"] = True
                
                current_status[c_id] = status_entry
                updated = True

        if updated:
            metrics.commitments_status = current_status
            
            # Recalculate overall completion score
            total_commitments = len(commitments)
            completed_count = sum(1 for v in current_status.values() if v.get("completed"))
            
            if total_commitments > 0:
                metrics.overall_completion_pct = round((completed_count / total_commitments) * 100, 1)
            
            # Mark that there was activity today (for consistency)
            metrics.consistency_score = 100  # Has activity = 100% consistency for the day
            
            # Calculate diligence (how much of targets achieved)
            total_target_pct = 0
            applicable_count = 0
            for c_id, status in current_status.items():
                target = status.get("target")
                achieved = status.get("achieved", 0)
                if target and float(target) > 0:
                    pct = min((float(achieved) / float(target)) * 100, 100)
                    total_target_pct += pct
                    applicable_count += 1
            
            if applicable_count > 0:
                metrics.diligence_score = round(total_target_pct / applicable_count, 1)
            
            # Recalculate cumulative rates from all metrics in this challenge
            all_metrics_query = select(DailyChallengeMetrics).where(
                DailyChallengeMetrics.challenge_id == challenge.id,
                DailyChallengeMetrics.date <= effective_date
            ).order_by(DailyChallengeMetrics.date.asc())
            all_metrics = db.exec(all_metrics_query).all()
            
            total_days = len(all_metrics)
            consistent_days = sum(1 for m in all_metrics if m.consistency_score and m.consistency_score > 0)
            total_diligence = sum(m.diligence_score or 0 for m in all_metrics)
            
            if total_days > 0:
                metrics.cumulative_consistency_rate = round((consistent_days / total_days) * 100, 1)
                metrics.cumulative_diligence_rate = round(total_diligence / total_days, 1)
            
            # Calculate streak (consecutive days with 70%+ completion)
            streak = 0
            for m in reversed(all_metrics):
                if m.overall_completion_pct and m.overall_completion_pct >= 70:
                    streak += 1
                else:
                    break
            metrics.consecutive_completion_streak = streak
            
            db.add(metrics)
            db.commit()
            db.refresh(metrics)
            return metrics
            
    except Exception as e:
        print(f"ERROR in update_challenge_progress: {e}")
        return None

def calculate_duration_minutes(start_time: time, end_time: time) -> int:
    """Calculate duration in minutes, handling overnight activities."""
    if end_time < start_time:
        # Overnight
        return (24 * 60) - (start_time.hour * 60 + start_time.minute) + (end_time.hour * 60 + end_time.minute)
    else:
        return (end_time.hour * 60 + end_time.minute) - (start_time.hour * 60 + start_time.minute)
