// src/hooks/usePWAUpdate.ts
"use client";

import { useState, useEffect } from "react";

export const usePWAUpdate = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    // This effect runs only in the browser
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          // A new service worker is already waiting
          setWaitingWorker(registration.waiting);
          setIsUpdateAvailable(true);
        }

        // Listen for new workers that enter the waiting state
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // This event fires when the new service worker has taken control
          // At this point, it's safe to reload the page to see the changes
          window.location.reload();
        });

        // Listen for updates to the service worker registration
        registration?.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New worker is installed and waiting
                setWaitingWorker(newWorker);
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      } catch (error) {
        console.error("Error during service worker registration:", error);
      }
    };

    registerServiceWorker();
  }, []);

  const triggerUpdate = () => {
    if (waitingWorker) {
      // Send a message to the waiting service worker to skip the waiting phase
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  return { isUpdateAvailable, triggerUpdate };
};