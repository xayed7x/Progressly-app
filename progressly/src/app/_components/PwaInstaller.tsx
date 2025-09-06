"use client";

import { useEffect } from "react";

export default function PwaInstaller() {
  useEffect(() => {
    console.log("PwaInstaller: Starting service worker registration...");
    
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered successfully with scope:", registration.scope);
          console.log("Service Worker state:", registration.active?.state);
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    } else {
      console.warn("⚠️ Service Worker not supported in this browser");
    }
  }, []);

  return null; // This component doesn't render anything
}
