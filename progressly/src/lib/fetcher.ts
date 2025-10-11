// src/lib/fetcher.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a Supabase client instance. 
// This is safe to run in a browser environment.
const supabase = createClientComponentClient();

/**
 * Authenticated fetcher for SWR that automatically includes the user's access token.
 * Prepends the API base URL if the path starts with '/api/'.
 * 
 * @param url - The URL or path to fetch from
 * @returns The JSON response
 * @throws Error if not authenticated or if the request fails
 */
export const fetcher = async (url: string) => {
  // First, get the current user's session.
  const { data: { session } } = await supabase.auth.getSession();

  // If there is no session, the user is not logged in.
  // SWR will treat this as an error.
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Construct the full URL if it's a relative API path
  const fullUrl = url.startsWith('/api/') 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`
    : url;

  // Now, make the fetch request, but this time,
  // we add the Authorization header with the user's access token.
  const res = await fetch(fullUrl, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    try {
      error.info = await res.json();
    } catch (e) {
      // The response might not be JSON
      error.info = await res.text();
    }
    error.status = res.status;
    throw error;
  }

  return res.json();
};

/**
 * Authenticated fetcher specifically for the backend API.
 * Always prepends the API base URL.
 * 
 * @param path - The API path (e.g., '/chat/history')
 * @returns The JSON response
 */
export const authenticatedFetcher = async (path: string) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error: any = new Error(`API error: ${res.statusText}`);
    try {
      error.info = await res.json();
    } catch (e) {
      error.info = await res.text();
    }
    error.status = res.status;
    throw error;
  }

  return res.json();
};