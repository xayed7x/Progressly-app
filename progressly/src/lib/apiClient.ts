import { DailySummaryItem } from "./types";

/**
 * Fetches the daily summary data from the backend API.
 *
 * @param {string | null} token - The Supabase session access token.
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

/**
 * Updates an existing activity in the backend API.
 *
 * @param {number} activityId - The ID of the activity to update.
 * @param {object} updateData - The data to update the activity with.
 * @param {string} token - The authentication token.
 * @returns {Promise<any>} - A promise that resolves to the updated activity data.
 */
export async function updateActivity(
  activityId: number,
  updateData: {
    activity_name: string;
    start_time: string;
    end_time: string;
    category_id: number;
  },
  token: string
): Promise<any> {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/activities/${activityId}`;

  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error("Failed to update activity");
  }

  return response.json();
}
