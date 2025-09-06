"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

export default function ResilientPwaButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const checkForExistingPrompt = () => {
      if ((window as any).deferredPrompt) {
        setInstallPrompt(
          (window as any).deferredPrompt as BeforeInstallPromptEvent
        );
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    checkForExistingPrompt();

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
    }
  };

  if (!installPrompt) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="ghost"
      size="icon"
      aria-label="Install App"
    >
      <ArrowDownToLine className="h-5 w-5 text-foreground" />
    </Button>
  );
}
