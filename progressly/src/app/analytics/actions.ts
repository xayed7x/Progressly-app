"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

async function getAuthHeaders() {
  const supabase = createServerActionClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

// Helper function to calculate duration in minutes from start_time and end_time
function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  // Parse time strings (HH:MM:SS or HH:MM format)
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    return parts[0] * 60 + parts[1]; // Convert to minutes
  };
  
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  
  // Handle overnight activities (e.g., 23:00 to 07:00)
  if (endMinutes < startMinutes) {
    return (24 * 60) - startMinutes + endMinutes;
  }
  
  return endMinutes - startMinutes;
}

// Get analytics overview data
export async function getAnalyticsOverview() {
  try {
    const headers = await getAuthHeaders();
    
    // Get all activities from dashboard-bootstrap and active challenge
    const [bootstrapRes, challengeRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/dashboard-bootstrap`, { headers }),
      fetch(`${API_BASE_URL}/api/challenges/active`, { headers }),
    ]);

    const bootstrapData = bootstrapRes.ok ? await bootstrapRes.json() : { activities_last_3_days: [] };
    const allActivities = bootstrapData.activities_last_3_days || [];
    const challenge = challengeRes.ok ? await challengeRes.json() : null;

    // Get date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStr = today.toISOString().split('T')[0];
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    // Filter activities by date range
    const filterByDate = (activities: any[], startDateStr: string) => {
      return activities.filter((a: any) => {
        const actDate = a.effective_date || a.activity_date?.split('T')[0];
        return actDate && actDate >= startDateStr;
      });
    };

    const todayActivities = allActivities.filter((a: any) => {
      const actDate = a.effective_date || a.activity_date?.split('T')[0];
      return actDate === todayStr;
    });
    const weekActivities = filterByDate(allActivities, weekAgoStr);
    const monthActivities = filterByDate(allActivities, monthAgoStr);

    // Calculate totals - use start_time and end_time to compute duration
    const calcTotal = (activities: any[]) => 
      activities.reduce((sum, a) => {
        const duration = calculateDuration(a.start_time, a.end_time);
        return sum + duration;
      }, 0);

    const todayTotal = calcTotal(todayActivities);
    const weekTotal = calcTotal(weekActivities);
    const monthTotal = calcTotal(monthActivities);

    // Calculate category breakdown for the week
    const categoryBreakdown: Record<string, number> = {};
    weekActivities.forEach((a: any) => {
      const cat = a.category?.name || a.category_name || "Uncategorized";
      const duration = calculateDuration(a.start_time, a.end_time);
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + duration;
    });

    // Sort by duration descending
    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, duration]) => ({ name, duration }));

    // Calculate daily average
    const daysWithActivity = new Set(
      monthActivities.map((a: any) => a.effective_date || a.start_time?.split('T')[0])
    ).size;
    const dailyAverage = daysWithActivity > 0 ? monthTotal / daysWithActivity : 0;

    // Challenge progress
    let challengeProgress = null;
    if (challenge) {
      const startDate = new Date(challenge.start_date);
      const today = new Date();
      const dayNumber = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      challengeProgress = {
        name: challenge.name,
        dayNumber,
        totalDays: challenge.duration_days,
        percentComplete: Math.round((dayNumber / challenge.duration_days) * 100),
      };
    }

    return {
      success: true,
      data: {
        todayTotal,
        weekTotal,
        monthTotal,
        dailyAverage,
        topCategories,
        challengeProgress,
        activityCount: {
          today: todayActivities.length,
          week: weekActivities.length,
          month: monthActivities.length,
        }
      }
    };
  } catch (error: any) {
    console.error("getAnalyticsOverview error:", error);
    return { success: false, error: error.message };
  }
}

// Get trends data (daily totals for charting)
export async function getTrendsData(days: number = 30) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/dashboard-bootstrap`, { headers });
    
    if (!response.ok) {
      return { success: true, data: [] };
    }

    const bootstrapData = await response.json();
    const allActivities = bootstrapData.activities_last_3_days || [];

    // Filter to last N days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    const activities = allActivities.filter((a: any) => {
      const actDate = a.effective_date || a.activity_date?.split('T')[0];
      return actDate && actDate >= cutoffStr;
    });

    // Group by date
    const dailyTotals: Record<string, { total: number, categories: Record<string, number> }> = {};
    
    activities.forEach((a: any) => {
      const date = a.effective_date || a.start_time?.split('T')[0];
      if (!date) return;
      
      if (!dailyTotals[date]) {
        dailyTotals[date] = { total: 0, categories: {} };
      }
      
      const duration = calculateDuration(a.start_time, a.end_time);
      dailyTotals[date].total += duration;
      
      const cat = a.category?.name || a.category_name || "Other";
      dailyTotals[date].categories[cat] = (dailyTotals[date].categories[cat] || 0) + duration;
    });

    // Convert to array sorted by date
    const trendData = Object.entries(dailyTotals)
      .map(([date, data]) => ({
        date,
        total: Math.round(data.total),
        ...data.categories
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: trendData };
  } catch (error: any) {
    console.error("getTrendsData error:", error);
    return { success: false, error: error.message };
  }
}

// Get comparison data (target vs actual)
export async function getComparisonData() {
  try {
    const headers = await getAuthHeaders();
    
    const [targetsRes, categoriesRes, bootstrapRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/targets`, { headers }),
      fetch(`${API_BASE_URL}/api/categories`, { headers }),
      fetch(`${API_BASE_URL}/api/dashboard-bootstrap`, { headers }),
    ]);

    const targets = targetsRes.ok ? await targetsRes.json() : [];
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];
    const bootstrapData = bootstrapRes.ok ? await bootstrapRes.json() : { activities_last_3_days: [] };
    const allActivities = bootstrapData.activities_last_3_days || [];

    // Filter to last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    const activities = allActivities.filter((a: any) => {
      const actDate = a.effective_date || a.activity_date?.split('T')[0];
      return actDate && actDate >= weekAgoStr;
    });

    // Calculate actual hours per category (weekly average)
    const actualByCategory: Record<string, number> = {};
    activities.forEach((a: any) => {
      const cat = a.category?.name || a.category_name || "Uncategorized";
      const durationMinutes = calculateDuration(a.start_time, a.end_time);
      const hours = durationMinutes / 60; // Convert minutes to hours
      actualByCategory[cat] = (actualByCategory[cat] || 0) + hours;
    });

    // Average over 7 days
    Object.keys(actualByCategory).forEach(cat => {
      actualByCategory[cat] = actualByCategory[cat] / 7;
    });

    // Build comparison data
    const comparisonData = targets.map((target: any) => {
      const catName = target.category_name;
      const category = categories.find((c: any) => c.name === catName);
      const actual = actualByCategory[catName] || 0;
      const targetHours = target.target_hours || 0;
      const percentage = targetHours > 0 ? Math.round((actual / targetHours) * 100) : 0;

      return {
        category: catName,
        color: category?.color || "#808080",
        target: Math.round(targetHours * 10) / 10,
        actual: Math.round(actual * 10) / 10,
        percentage,
        difference: Math.round((actual - targetHours) * 10) / 10,
      };
    });

    return { success: true, data: comparisonData };
  } catch (error: any) {
    console.error("getComparisonData error:", error);
    return { success: false, error: error.message };
  }
}

// Get daily challenge history (for the History tab)
export async function getDailyHistory() {
  try {
    const headers = await getAuthHeaders();
    
    // Get active challenge
    const challengeRes = await fetch(`${API_BASE_URL}/api/challenges/active`, { headers });
    
    if (!challengeRes.ok) {
      return { success: true, data: [], challenge: null };
    }
    
    const challenge = await challengeRes.json();
    if (!challenge || !challenge.id) {
      return { success: true, data: [], challenge: null };
    }
    
    // Fetch daily metrics from Supabase directly using the API
    // We'll use the dashboard-bootstrap which has activities
    const bootstrapRes = await fetch(`${API_BASE_URL}/api/dashboard-bootstrap`, { headers });
    const bootstrapData = bootstrapRes.ok ? await bootstrapRes.json() : { activities_last_3_days: [] };
    
    // Group activities by date and calculate completion
    const allActivities = bootstrapData.activities_last_3_days || [];
    const commitments = challenge.commitments || [];
    
    // Get all dates from challenge start to today
    const startDate = new Date(challenge.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyMetrics: Array<{
      date: string;
      dayNumber: number;
      overallCompletion: number;
      hasActivity: boolean;
      commitmentDetails: Array<{
        habit: string;
        target: number | string;
        achieved: number;
        unit: string;
        isComplete: boolean;
      }>;
    }> = [];
    
    // Calculate metrics for each day
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Get activities for this day
      const dayActivities = allActivities.filter((a: any) => {
        const actDate = a.effective_date || a.activity_date?.split('T')[0];
        return actDate === dateStr;
      });
      
      // Calculate commitment progress
      const commitmentDetails: Array<{
        habit: string;
        target: number | string;
        achieved: number;
        unit: string;
        isComplete: boolean;
      }> = [];
      
      let totalCompletion = 0;
      let commitmentCount = 0;
      
      for (const comm of commitments) {
        const categoryName = comm.category || comm.habit;
        const relevantActivities = dayActivities.filter((a: any) => 
          a.category?.name?.toLowerCase() === categoryName?.toLowerCase() ||
          a.activity_name?.toLowerCase().includes(comm.habit?.toLowerCase())
        );
        
        let achieved = 0;
        if (comm.unit === 'hours' || comm.unit === 'minutes') {
          const totalMinutes = relevantActivities.reduce((sum: number, a: any) => {
            return sum + calculateDuration(a.start_time, a.end_time);
          }, 0);
          achieved = comm.unit === 'hours' ? totalMinutes / 60 : totalMinutes;
        } else {
          achieved = relevantActivities.length > 0 ? 1 : 0;
        }
        
        const target = typeof comm.target === 'number' ? comm.target : 1;
        const completion = Math.min((achieved / target) * 100, 100);
        totalCompletion += completion;
        commitmentCount++;
        
        commitmentDetails.push({
          habit: comm.habit,
          target: comm.target,
          achieved: Math.round(achieved * 100) / 100,
          unit: comm.unit || '',
          isComplete: completion >= 100
        });
      }
      
      const overallCompletion = commitmentCount > 0 ? Math.round(totalCompletion / commitmentCount) : 0;
      
      dailyMetrics.push({
        date: dateStr,
        dayNumber: dayNum,
        overallCompletion,
        hasActivity: dayActivities.length > 0,
        commitmentDetails
      });
    }
    
    // Reverse to show most recent first
    dailyMetrics.reverse();
    
    return { 
      success: true, 
      data: dailyMetrics,
      challenge: {
        name: challenge.name,
        totalDays: challenge.duration_days,
        startDate: challenge.start_date,
        endDate: challenge.end_date
      }
    };
  } catch (error: any) {
    console.error("getDailyHistory error:", error);
    return { success: false, error: error.message };
  }
}
