// src/hooks/usePWAUpdate.ts
"use client";

import { useState, useEffect } from "react";
import type { Workbox } from "workbox-window";

// It's good practice to declare the type for the window object
declare global {
  interface Window {
    workbox: Workbox;
  }
}

export const usePWAUpdate = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !window.workbox
    ) {
      return;
    }

    const wb = window.workbox;

    // A new service worker has successfully installed and is waiting to activate.
    const handleWaiting = (event: any) => {
      setIsUpdateAvailable(true);
      setWaitingWorker(event.sw);
    };

    wb.addEventListener("waiting", handleWaiting);

    // This event fires when the new service worker has taken control.
    // At this point, it's safe to reload the page to see the changes.
    const handleControlling = (event: any) => {
      if (event.isUpdate) {
        window.location.reload();
      }
    };

    wb.addEventListener("controlling", handleControlling);

    // Register the service worker.
    // This should be done after adding the event listeners.
    wb.register();

    return () => {
      wb.removeEventListener("waiting", handleWaiting);
      wb.removeEventListener("controlling", handleControlling);
    };
  }, []);

  const triggerUpdate = () => {
    if (waitingWorker) {
      // Send a message to the waiting service worker to skip the waiting phase.
      // This is the command that the user initiates by clicking "Update".
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  return { isUpdateAvailable, triggerUpdate };
};


