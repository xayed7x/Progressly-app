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
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (!installPrompt) {
      if (isIOS) {
        toast({
          title: "To install this app:",
          description: "Tap the 'Share' button and then 'Add to Home Screen'.",
        });
      } else {
        // For Android, if installPrompt is null here, it means the event didn't fire or was already used.
        // We should not open the dialog or show an install button if there's no prompt to trigger.
        toast({
          title: "Installation not available",
          description: "This device does not support PWA installation, or the prompt has already been dismissed.",
        });
      }
      return;
    }
    setIsDialogOpen(true); // Open the custom dialog
  };

  const handleNativePrompt = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      // The prompt can only be used once, so set it to null after attempting to prompt.
      setInstallPrompt(null);
    }
    setIsDialogOpen(false); // Close the custom dialog
  };

  // If there's no install prompt, and it's not iOS (where prompt doesn't fire), hide the button.
  // This covers cases where PWA is already installed or not installable.
  if (!installPrompt && typeof navigator !== 'undefined' && !/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return null;
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
          <Button onClick={handleNativePrompt} className="bg-accent text-accent-foreground hover:bg-accent">Install App</Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
