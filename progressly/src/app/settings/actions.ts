"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// --- Helper to get authenticated fetch headers ---
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

// ==================== CATEGORIES ====================

export async function getCategories() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "GET",
      headers,
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("getCategories error:", error);
    return [];
  }
}

export async function createCategory(name: string, color: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, color }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to create category" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, data: await response.json() };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function updateCategory(categoryId: number, name: string, color: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ name, color }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to update category" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, data: await response.json() };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function deleteCategory(categoryId: number) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to delete category" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ==================== GOALS ====================

export async function getGoals() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      method: "GET",
      headers,
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("getGoals error:", error);
    return [];
  }
}

export async function createGoal(content: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to save goal" };
    }

    revalidatePath("/settings");
    return { success: true, data: await response.json() };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function updateGoal(goalId: number, content: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to update goal" };
    }

    revalidatePath("/settings");
    return { success: true, data: await response.json() };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function deleteGoal(goalId: number) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to delete goal" };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ==================== DAILY TARGETS ====================

export async function getDailyTargets() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/targets`, {
      method: "GET",
      headers,
    });

    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("getDailyTargets error:", error);
    return [];
  }
}

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

    revalidatePath("/settings");
    return { success: true, data: await response.json() };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
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

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// ==================== CHALLENGES ====================

export async function getActiveChallenge() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/challenges/active`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("getActiveChallenge error:", error);
    return null;
  }
}

export async function updateChallenge(challengeId: string, updates: { name?: string; commitments?: any[] }) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to update challenge" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, data: await response.json() };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

export async function abandonChallenge(challengeId: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}/abandon`, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to abandon challenge" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
