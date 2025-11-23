"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

async function getAuthHeaders() {
  const supabase = createServerActionClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function checkOnboardingStatus() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/user/onboarding-status`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to check onboarding status");
    }

    const data = await response.json();
    return data.has_completed_onboarding;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    // Default to false (force onboarding) if check fails, or true (skip) to be safe?
    // Safer to default to false so they don't miss onboarding, but annoying if error.
    // Let's return false to be safe.
    return false;
  }
}
