"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

import { auth } from "@clerk/nextjs/server";

export async function createGoal(formData: FormData) {
  // The 'await' here is the final fix.
  // We must wait for the auth() promise to resolve.
  const { userId, getToken } = await auth();

  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  const token = await getToken({ template: "fastapi" });

  if (!token) {
    return { success: false, error: "Authentication token is missing." };
  }

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
