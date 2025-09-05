import { DailySummaryItem } from "./types";

/**
 * Fetches the daily summary data from the backend API.
 *
 * @param {() => Promise<string | null>} getToken - The getToken function from Clerk's useAuth hook.
 * @param {Date} date - The specific date to fetch the summary for.
 * @returns {Promise<DailySummaryItem[]>} - A promise that resolves to the summary data.
 */
export async function getDailySummary(
  getToken: () => Promise<string | null>,
  date: Date
): Promise<DailySummaryItem[]> {
  const token = await getToken();
  if (!token) {
    throw new Error("User is not authenticated.");
  }

  // Format the date into YYYY-MM-DD string format for the API URL
  const dateString = date.toISOString().split("T")[0];

  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/summary/daily/${dateString}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // You could add more sophisticated error handling here
    throw new Error("Failed to fetch daily summary data");
  }

  return response.json();
}
