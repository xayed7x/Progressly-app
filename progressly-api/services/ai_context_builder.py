# services/ai_context_builder.py
"""
AI Context Builder Service
Builds comprehensive context for the AI coach including challenge info,
performance metrics, streaks, patterns, and recent activities.
"""

from datetime import date, datetime, timedelta, time
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from models import (
    Challenge, 
    DailyChallengeMetrics, 
    LoggedActivity, 
    Goal, 
    DailyTarget
)


def calculate_duration_minutes(start_time: time, end_time: time) -> int:
    """Calculate duration in minutes, handling overnight activities."""
    if end_time < start_time:
        # Overnight
        return (24 * 60) - (start_time.hour * 60 + start_time.minute) + (end_time.hour * 60 + end_time.minute)
    else:
        return (end_time.hour * 60 + end_time.minute) - (start_time.hour * 60 + start_time.minute)


def calculate_current_streak(metrics: List[DailyChallengeMetrics], threshold: float = 70.0) -> int:
    """
    Calculate current streak of consecutive days with completion >= threshold.
    Metrics should be sorted by date descending (most recent first).
    """
    streak = 0
    for metric in metrics:
        if metric.overall_completion_pct >= threshold:
            streak += 1
        else:
            break
    return streak


def calculate_longest_streak(metrics: List[DailyChallengeMetrics], threshold: float = 70.0) -> int:
    """
    Calculate longest streak of consecutive days with completion >= threshold.
    """
    if not metrics:
        return 0
    
    max_streak = 0
    current_streak = 0
    
    # Sort chronologically (oldest first)
    sorted_metrics = sorted(metrics, key=lambda m: m.date)
    
    for metric in sorted_metrics:
        if metric.overall_completion_pct >= threshold:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0
    
    return max_streak


def format_commitment_progress(
    commitment: dict, 
    status: dict
) -> str:
    """Format a single commitment's progress for display."""
    habit = commitment.get("habit", "Unknown")
    target = commitment.get("target", "?")
    unit = commitment.get("unit", "")
    
    achieved = status.get("achieved", 0)
    completed = status.get("completed", False)
    
    if unit in ["hours", "minutes"]:
        if unit == "hours":
            return f"• {habit}: {achieved:.1f}/{target} hours {'✓' if completed else ''}"
        else:
            return f"• {habit}: {achieved:.0f}/{target} minutes {'✓' if completed else ''}"
    else:
        # Binary completion
        return f"• {habit}: {'✓ Complete' if completed else '○ Not yet'}"


def build_coach_context(
    db: Session, 
    user_id: str, 
    challenge_id: Optional[UUID] = None
) -> str:
    """
    Build comprehensive context for AI coach.
    
    Gathers:
    - Challenge information (name, day, commitments, identity/why)
    - Current performance (today's progress)
    - Last 7 days summary
    - Streaks (current and longest)
    - Goals and daily targets
    - Recent activities (last 7 days)
    
    Returns a formatted string for the AI prompt.
    """
    context_sections = []
    today = date.today()
    seven_days_ago = today - timedelta(days=7)
    
    # --- 1. Get Active Challenge (if not specified) ---
    challenge = None
    if challenge_id:
        challenge = db.get(Challenge, challenge_id)
    else:
        statement = select(Challenge).where(
            Challenge.user_id == user_id,
            Challenge.status == "active"
        ).order_by(Challenge.created_at.desc())
        challenge = db.exec(statement).first()
    
    # --- 2. Build Challenge Context ---
    if challenge:
        # Calculate current day number
        day_number = (today - challenge.start_date).days + 1
        total_days = challenge.duration_days
        
        # Challenge header
        context_sections.append(f"""
=== ACTIVE CHALLENGE ===
Challenge: "{challenge.name}"
Day: {day_number} of {total_days}
Start Date: {challenge.start_date}
Success Threshold: {challenge.success_threshold}%""")
        
        # Identity and Why statements (very important for coaching!)
        if challenge.identity_statement:
            context_sections.append(f'Identity Statement: "{challenge.identity_statement}"')
        if challenge.why_statement:
            context_sections.append(f'Why Statement: "{challenge.why_statement}"')
        
        # Commitments
        commitments = challenge.commitments or []
        if commitments:
            commitment_lines = ["", "COMMITMENTS:"]
            for c in commitments:
                habit = c.get("habit", "Unknown")
                target = c.get("target", "?")
                unit = c.get("unit", "")
                frequency = c.get("frequency", "daily")
                category = c.get("category", "")
                
                if unit:
                    commitment_lines.append(f"• {habit}: {target} {unit} ({frequency}) [{category}]")
                else:
                    commitment_lines.append(f"• {habit}: Complete daily ({frequency}) [{category}]")
            
            context_sections.append("\n".join(commitment_lines))
        
        # --- 3. Get Daily Metrics ---
        metrics_query = select(DailyChallengeMetrics).where(
            DailyChallengeMetrics.challenge_id == challenge.id,
            DailyChallengeMetrics.date >= seven_days_ago
        ).order_by(DailyChallengeMetrics.date.desc())
        
        recent_metrics = list(db.exec(metrics_query).all())
        
        # Today's progress
        today_metric = next((m for m in recent_metrics if m.date == today), None)
        
        if today_metric and today_metric.commitments_status:
            progress_lines = ["", "TODAY'S PROGRESS:"]
            for c in commitments:
                c_id = c.get("id")
                if c_id and c_id in today_metric.commitments_status:
                    progress_lines.append(format_commitment_progress(
                        c, today_metric.commitments_status[c_id]
                    ))
            progress_lines.append(f"Overall: {today_metric.overall_completion_pct:.0f}% complete")
            context_sections.append("\n".join(progress_lines))
        else:
            context_sections.append("\nTODAY'S PROGRESS:\nNo activities logged yet today.")
        
        # Last 7 days summary
        if recent_metrics:
            summary_lines = ["", "LAST 7 DAYS:"]
            for metric in recent_metrics[:7]:
                day_label = f"Day {metric.day_number}"
                pct = metric.overall_completion_pct
                
                # Add visual indicator
                if pct >= 90:
                    indicator = "🟢"
                elif pct >= 70:
                    indicator = "🟡"
                elif pct > 0:
                    indicator = "🟠"
                else:
                    indicator = "⚪"
                
                note = f" - {metric.notes}" if metric.notes else ""
                summary_lines.append(f"{indicator} {metric.date}: {pct:.0f}%{note}")
            
            context_sections.append("\n".join(summary_lines))
        
        # Streaks
        all_metrics_query = select(DailyChallengeMetrics).where(
            DailyChallengeMetrics.challenge_id == challenge.id
        ).order_by(DailyChallengeMetrics.date.desc())
        all_metrics = list(db.exec(all_metrics_query).all())
        
        if all_metrics:
            current_streak = calculate_current_streak(all_metrics, challenge.success_threshold)
            longest_streak = calculate_longest_streak(all_metrics, challenge.success_threshold)
            
            context_sections.append(f"""
STREAKS (days with ≥{challenge.success_threshold:.0f}% completion):
• Current streak: {current_streak} days
• Longest streak: {longest_streak} days""")
    
    # --- 4. Goals ---
    goals = db.exec(select(Goal).where(Goal.user_id == user_id)).all()
    if goals:
        goal_lines = ["", "USER'S GOALS:"]
        for goal in goals:
            goal_lines.append(f"🎯 {goal.content}")
        context_sections.append("\n".join(goal_lines))
    
    # --- 5. Daily Targets ---
    targets = db.exec(select(DailyTarget).where(DailyTarget.user_id == user_id)).all()
    if targets:
        target_lines = ["", "DAILY TIME TARGETS:"]
        for target in targets:
            target_lines.append(f"• {target.category_name}: {target.target_hours} hours/day")
        context_sections.append("\n".join(target_lines))
    
    # --- 6. Recent Activities (last 7 days) ---
    activities_query = select(LoggedActivity).options(
        selectinload(LoggedActivity.category_rel)
    ).where(
        LoggedActivity.user_id == user_id,
        LoggedActivity.activity_date >= datetime.combine(seven_days_ago, time.min)
    ).order_by(LoggedActivity.activity_date.desc()).limit(50)
    
    recent_activities = db.exec(activities_query).all()
    
    if recent_activities:
        # Group by date
        activities_by_date: Dict[date, List[LoggedActivity]] = {}
        for activity in recent_activities:
            activity_date = activity.effective_date or activity.activity_date.date()
            if activity_date not in activities_by_date:
                activities_by_date[activity_date] = []
            activities_by_date[activity_date].append(activity)
        
        activity_lines = ["", "RECENT ACTIVITIES:"]
        for d in sorted(activities_by_date.keys(), reverse=True)[:3]:  # Last 3 days
            if d == today:
                activity_lines.append(f"Today:")
            elif d == today - timedelta(days=1):
                activity_lines.append(f"Yesterday:")
            else:
                activity_lines.append(f"{d}:")
            
            for act in activities_by_date[d][:5]:  # Max 5 per day
                duration = calculate_duration_minutes(act.start_time, act.end_time)
                cat_name = act.category_rel.name if act.category_rel else "Uncategorized"
                hours = duration / 60
                activity_lines.append(f"  • {act.activity_name} [{cat_name}]: {hours:.1f}h")
        
        context_sections.append("\n".join(activity_lines))
    
    # --- Combine all sections ---
    if not context_sections:
        return "No challenge or activity data available for this user."
    
    full_context = "\n".join(context_sections)
    return full_context
