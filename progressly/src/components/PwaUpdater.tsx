"use client";

import { useEffect } from "react";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function PwaUpdater() {
  const { isUpdateAvailable, triggerUpdate } = usePWAUpdate();
  const { toast } = useToast();

  useEffect(() => {
    if (isUpdateAvailable) {
      toast({
        title: "A new version is available.",
        description: "Update now to get the latest features and bug fixes.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              triggerUpdate();
            }}
          >
            Update
          </Button>
        ),
        duration: Infinity, // Keep the toast open until user interacts
      });
    }
  }, [isUpdateAvailable, toast, triggerUpdate]);

  return null; // This component doesn't render anything visible
}
