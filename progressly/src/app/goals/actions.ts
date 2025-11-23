"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// --- Helper to get authenticated fetch headers ---
async function getAuthHeaders() {
  const supabase = createServerActionClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

// --- Goals (Big Dream) ---

export async function createGoal(formData: FormData) {
  const goalContent = formData.get("goal") as string;
  if (!goalContent) {
    return { success: false, error: "Goal content is required" };
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content: goalContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to save goal" };
    }

    revalidatePath('/goals');
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("createGoal error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function getGoals() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
        return [];
    }

    return await response.json();
  } catch (error) {
    console.error("getGoals error:", error);
    return [];
  }
}

export async function getCategories() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
        return [];
    }

    return await response.json();
  } catch (error) {
    console.error("getCategories error:", error);
    return [];
  }
}

// --- Daily Targets ---

export async function saveDailyTarget(categoryName: string, targetHours: number) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/targets`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        category_name: categoryName,
        target_hours: targetHours,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to save target" };
    }

    revalidatePath('/goals');
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("saveDailyTarget error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function getDailyTargets() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/targets`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
        return [];
    }

    return await response.json();
  } catch (error) {
    console.error("getDailyTargets error:", error);
    return [];
  }
}

export async function updateDailyTarget(targetId: number, categoryName: string, targetHours: number) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/targets/${targetId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        category_name: categoryName,
        target_hours: targetHours,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to update target" };
    }

    revalidatePath('/goals');
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("updateDailyTarget error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function deleteDailyTarget(targetId: number) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/targets/${targetId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
       const errorData = await response.json();
       return { success: false, error: errorData.detail || "Failed to delete target" };
    }

    revalidatePath('/goals');
    return { success: true };
  } catch (error: any) {
    console.error("deleteDailyTarget error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
