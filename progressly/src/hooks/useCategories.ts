import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { Category } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export function useCategories() {
  const { getToken } = useAuth();

  const fetcher = async (url: string) => {
    const token = await getToken({ template: "fastapi" });
    if (!token) {
      throw new Error("User is not authenticated.");
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch categories");
    }
    return res.json();
  };

  return useSWR<Category[]>(`${API_BASE_URL}/api/categories`, fetcher);
}
