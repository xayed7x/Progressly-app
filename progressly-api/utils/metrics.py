# utils/metrics.py
"""
Streak and metrics calculation utilities for challenge tracking.
"""

from typing import List, Any
from datetime import date


def calculate_current_streak(
    daily_metrics: List[Any], 
    threshold: float = 70.0
) -> int:
    """
    Calculate current streak of consecutive days with completion >= threshold.
    
    Args:
        daily_metrics: List of daily_challenge_metrics ordered by date DESC (most recent first)
        threshold: Minimum completion percentage to count as "successful" day (default 70%)
    
    Returns:
        Number of consecutive successful days from today

    Example:
        >>> metrics = [
        ...     {'date': '2024-01-03', 'overall_completion_pct': 85},  # today
        ...     {'date': '2024-01-02', 'overall_completion_pct': 72},
        ...     {'date': '2024-01-01', 'overall_completion_pct': 50},  # broke streak
        ... ]
        >>> calculate_current_streak(metrics)
        2
    """
    streak = 0
    for metric in daily_metrics:
        # Handle both dict and object access
        completion = (
            metric.get('overall_completion_pct', 0) 
            if isinstance(metric, dict) 
            else getattr(metric, 'overall_completion_pct', 0)
        )
        
        if completion >= threshold:
            streak += 1
        else:
            break  # Streak broken
    
    return streak


def calculate_longest_streak(
    daily_metrics: List[Any], 
    threshold: float = 70.0
) -> int:
    """
    Calculate longest streak of consecutive days with completion >= threshold.
    
    Args:
        daily_metrics: List of daily_challenge_metrics (any order, will be sorted)
        threshold: Minimum completion percentage to count as "successful" day (default 70%)
    
    Returns:
        Maximum consecutive successful days in the dataset

    Example:
        >>> metrics = [
        ...     {'date': '2024-01-01', 'overall_completion_pct': 80},
        ...     {'date': '2024-01-02', 'overall_completion_pct': 85},
        ...     {'date': '2024-01-03', 'overall_completion_pct': 50},  # break
        ...     {'date': '2024-01-04', 'overall_completion_pct': 90},
        ...     {'date': '2024-01-05', 'overall_completion_pct': 75},
        ...     {'date': '2024-01-06', 'overall_completion_pct': 82},
        ... ]
        >>> calculate_longest_streak(metrics)
        3  # Days 4, 5, 6
    """
    if not daily_metrics:
        return 0
    
    # Sort by date chronologically (oldest first)
    def get_date(metric):
        if isinstance(metric, dict):
            return metric.get('date')
        return getattr(metric, 'date', None)
    
    sorted_metrics = sorted(daily_metrics, key=get_date)
    
    max_streak = 0
    current_streak = 0
    
    for metric in sorted_metrics:
        completion = (
            metric.get('overall_completion_pct', 0) 
            if isinstance(metric, dict) 
            else getattr(metric, 'overall_completion_pct', 0)
        )
        
        if completion >= threshold:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0
    
    return max_streak


def calculate_consistency_rate(daily_metrics: List[Any]) -> float:
    """
    Calculate percentage of days user showed up (any activity > 0).
    
    Returns:
        Percentage (0-100) of days with any logged activity
    """
    if not daily_metrics:
        return 0.0
    
    days_with_activity = 0
    for metric in daily_metrics:
        consistency = (
            metric.get('consistency_score', 0) 
            if isinstance(metric, dict) 
            else getattr(metric, 'consistency_score', 0)
        )
        if consistency > 0:
            days_with_activity += 1
    
    return round((days_with_activity / len(daily_metrics)) * 100, 1)


def calculate_diligence_rate(daily_metrics: List[Any]) -> float:
    """
    Calculate average diligence (how much of target was achieved).
    
    Returns:
        Average diligence percentage across all days
    """
    if not daily_metrics:
        return 0.0
    
    total_diligence = 0
    for metric in daily_metrics:
        diligence = (
            metric.get('diligence_score', 0) 
            if isinstance(metric, dict) 
            else getattr(metric, 'diligence_score', 0)
        )
        total_diligence += diligence
    
    return round(total_diligence / len(daily_metrics), 1)
