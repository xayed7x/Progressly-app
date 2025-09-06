// src/app/_components/pwa/PwaUpdater.tsx
"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";

export default function PwaUpdater() {
  const { toast } = useToast();
  const { isUpdateAvailable, triggerUpdate } = usePWAUpdate();

  useEffect(() => {
    if (isUpdateAvailable) {
      toast({
        title: "Update Available",
        description: "A new version of Progressly is ready.",
        duration: Infinity, // Keep the toast visible until dismissed or updated
        action: <Button onClick={() => triggerUpdate()}>Update</Button>,
      });
    }
  }, [isUpdateAvailable, toast, triggerUpdate]);

  // This component doesn't render anything itself, it just handles the update logic.
  return null;
}
