"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function logActivity(formData: FormData) {
  const { getToken } = await auth();
  const token = await getToken({ template: "fastapi" });

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
