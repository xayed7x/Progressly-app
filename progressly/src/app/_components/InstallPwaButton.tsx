"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Corrected import path
import { ArrowDownToLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    setIsDialogOpen(true); // Open the custom dialog
  };

  const handleNativePrompt = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null); // The prompt can only be used once
      }
    }
    setIsDialogOpen(false); // Close the custom dialog
  };

  // Only show the button if the app is not already installed and there's a prompt
  // (or if we can reasonably assume it's iOS where the prompt doesn't fire but it's installable)
  if (!installPrompt && typeof navigator !== 'undefined' && !/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleInstallClick} variant="ghost" size="icon" aria-label="Install App">
          <ArrowDownToLine className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle>Install Progressly</DialogTitle>
          <DialogDescription>
            To install Progressly, click the button below. This will open your browser's installation prompt.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleNativePrompt} className="bg-accent text-accent-foreground">Install App</Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}