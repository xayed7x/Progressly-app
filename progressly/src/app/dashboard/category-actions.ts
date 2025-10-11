"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- Action to CREATE a new category ---
export async function createCategory(formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    return { success: false, error: "Not authenticated." };
  }

  const categoryName = formData.get("name");
  const color = formData.get("color");

  if (!categoryName || !color) {
    return { success: false, error: "Category name and color are required." };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: categoryName, color }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.detail || "Failed to create category." };
    }

    const created = await response.json();

    // After a successful creation, revalidate the dashboard path
    revalidatePath("/dashboard");
    return { success: true, data: created };

  } catch (error) {
    return { success: false, error: "An unexpected error occurred." };
  }
}

// In the future, we can add updateCategory and deleteCategory actions here.