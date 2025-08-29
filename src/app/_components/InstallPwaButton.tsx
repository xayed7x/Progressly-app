"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine } from "lucide-react";

// Define the interface for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPwaButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // This will be the case for iOS/Safari
      toast({
        title: "To install this app:",
        description: "Tap the 'Share' button and then 'Add to Home Screen'.",
      });
      return;
    }

    // This is for Android/Chrome
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null); // The prompt can only be used once
    }
  };

  // Only show the button if the app is not already installed and there's a prompt
  // (or if we can reasonably assume it's iOS where the prompt doesn't fire but it's installable)
  if (!installPrompt && !/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      if (window.matchMedia('(display-mode: standalone)').matches) return null;
  }

  return (
    <Button onClick={handleInstallClick} variant="ghost" size="icon" aria-label="Install App">
      <ArrowDownToLine className="h-5 w-5" />
    </Button>
  );
}