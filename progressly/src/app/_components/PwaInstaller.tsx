"use client";

import { useState, useEffect } from "react";
import InstallPwaButton from "./InstallPwaButton";

export default function PwaInstaller() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true after component mounts on client
    setMounted(true);

    // Service worker registration (keeping existing functionality)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  // Don't render anything until mounted on client
  if (!mounted) {
    return null;
  }

  // Only render InstallPwaButton after client-side mount
  return <InstallPwaButton />;
}
