"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function createGoal(formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "User not authenticated." };
  }

  const token = session.access_token;

  const goalContent = formData.get("goal") as string;
  if (!goalContent) {
    return { success: false, error: "Goal content is required" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: goalContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return {
        success: false,
        error: errorData.detail || "Failed to save goal",
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Network or other error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
