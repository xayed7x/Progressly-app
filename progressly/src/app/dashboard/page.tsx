import { Suspense } from "react";
import { currentUser, auth } from "@clerk/nextjs/server";

import ActivityLogger from "./_components/ActivityLogger";
import GoalManager from "./_components/GoalManager";
import ActivityListSkeleton from "./_components/ActivityListSkeleton";
import ActivitiesWrapper from "./_components/ActivitiesWrapper";

import { Category } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getCategories(): Promise<Category[]> {
  // This is the final, correct syntax provided by the Clerk AI.
  // We MUST await the auth() call before destructuring.
  const { getToken } = await auth();

  // Robust check to ensure the auth object is valid.
  if (!getToken) {
    console.error("[Server Component] Could not get authentication context.");
    return [];
  }

  const token = await getToken({ template: "fastapi" });

  if (!token) {
    console.error("[Server Component] Authentication token could not be generated.");
    return [];
  }

  try {
    const url = `${API_BASE_URL}/api/categories`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.text();
      } catch (_) {}
      console.error(
        `[Server Component] Failed to fetch categories. URL: ${url}, status: ${res.status}, body: ${body}`
      );
      return [];
    }
    return res.json();
  } catch (e) {
    console.error("[Server Component] An error occurred while fetching categories:", e);
    return [];
  }
}

export default async function DashboardPage() {
  const user = await currentUser();
  const categories = await getCategories();
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-y-8">
        <h1 className="text-center text-3xl font-bold text-secondary">
          Welcome back, {user?.firstName || "Achiever"}!
        </h1>

        <ActivityLogger categories={categories} />

        <div className="w-full max-w-lg bg-secondary/40 p-4 rounded-lg">
          <Suspense fallback={<ActivityListSkeleton />}>
            <ActivitiesWrapper />
          </Suspense>
        </div>

        <div className="mt-8">
          <GoalManager />
        </div>
      </div>
    </main>
  );
}