"use client";

import { useState, useEffect } from "react";

export function useOnlineStatus(): boolean {
  // Initialize state with current online status
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined" && "navigator" in window) {
      return navigator.onLine;
    }
    // Default to true during SSR
    return true;
  });

  useEffect(() => {
    // Event handlers
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
