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

// Get analytics overview data
export async function getAnalyticsOverview() {
  try {
    const headers = await getAuthHeaders();
    
    // Get activities for various time periods
    const [todayRes, weekRes, monthRes, challengeRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/activities?days=1`, { headers }),
      fetch(`${API_BASE_URL}/api/activities?days=7`, { headers }),
      fetch(`${API_BASE_URL}/api/activities?days=30`, { headers }),
      fetch(`${API_BASE_URL}/api/challenges/active`, { headers }),
    ]);

    const todayActivities = todayRes.ok ? await todayRes.json() : [];
    const weekActivities = weekRes.ok ? await weekRes.json() : [];
    const monthActivities = monthRes.ok ? await monthRes.json() : [];
    const challenge = challengeRes.ok ? await challengeRes.json() : null;

    // Calculate totals
    const calcTotal = (activities: any[]) => 
      activities.reduce((sum, a) => sum + (a.duration || 0), 0);

    const todayTotal = calcTotal(todayActivities);
    const weekTotal = calcTotal(weekActivities);
    const monthTotal = calcTotal(monthActivities);

    // Calculate category breakdown for the week
    const categoryBreakdown: Record<string, number> = {};
    weekActivities.forEach((a: any) => {
      const cat = a.category?.name || a.category_name || "Uncategorized";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (a.duration || 0);
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
    const response = await fetch(`${API_BASE_URL}/api/activities?days=${days}`, { headers });
    
    if (!response.ok) {
      return { success: true, data: [] };
    }

    const activities = await response.json();

    // Group by date
    const dailyTotals: Record<string, { total: number, categories: Record<string, number> }> = {};
    
    activities.forEach((a: any) => {
      const date = a.effective_date || a.start_time?.split('T')[0];
      if (!date) return;
      
      if (!dailyTotals[date]) {
        dailyTotals[date] = { total: 0, categories: {} };
      }
      
      const duration = a.duration || 0;
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
    
    const [targetsRes, categoriesRes, activitiesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/targets`, { headers }),
      fetch(`${API_BASE_URL}/api/categories`, { headers }),
      fetch(`${API_BASE_URL}/api/activities?days=7`, { headers }),
    ]);

    const targets = targetsRes.ok ? await targetsRes.json() : [];
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];
    const activities = activitiesRes.ok ? await activitiesRes.json() : [];

    // Calculate actual hours per category (weekly average)
    const actualByCategory: Record<string, number> = {};
    activities.forEach((a: any) => {
      const cat = a.category?.name || a.category_name || "Uncategorized";
      const hours = (a.duration || 0) / 60; // Convert minutes to hours
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
