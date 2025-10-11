"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function logActivity(
  formData: FormData,
  target_date: string // Add target_date parameter
) {
  const supabase = createServerActionClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    return { success: false, error: "User not authenticated." };
  }

  // Extract data from the form
  const activityData = {
    activity_name: formData.get("activity_name") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    category_id: formData.get("category_id")
      ? Number(formData.get("category_id"))
      : null,
    target_date: target_date, // Include target_date in the payload
  };

  // Basic validation
  if (
    !activityData.activity_name ||
    !activityData.start_time ||
    !activityData.end_time ||
    activityData.category_id === null
  ) {
    return { success: false, error: "All fields are required." };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(activityData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return {
        success: false,
        error: errorData.detail || "Failed to log activity",
      };
    }

    // This tells Next.js to refresh the data on the dashboard page
    revalidatePath("/dashboard");
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("Network or other error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function deleteActivity(activityId: number) {
  const supabase = createServerActionClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return {
        success: false,
        error: errorData.detail || "Failed to delete activity",
      };
    }

    revalidatePath("/dashboard");
    return { success: true, data: { message: "Activity deleted" } };
  } catch (error) {
    console.error("Network or other error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}