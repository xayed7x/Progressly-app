"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
    let isComponentMounted = true;

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt event captured!", e);
      // Prevent the default browser install prompt
      e.preventDefault();
      // Only update state if component is still mounted
      if (isComponentMounted) {
        setInstallPrompt(e as BeforeInstallPromptEvent);
      }
    };

    const handleAppInstalled = () => {
      console.log("appinstalled event captured!");
      // Only update state if component is still mounted
      if (isComponentMounted) {
        setInstallPrompt(null);
        toast({
          title: "App Installed!",
          description: "Progressly has been installed successfully.",
        });
      }
    };

    // Check if the beforeinstallprompt event has already fired before we added the listener
    // This handles the race condition where the event fires very early in the page lifecycle
    const checkForExistingPrompt = () => {
      // Some browsers store the deferred prompt on the window object
      if ((window as any).deferredPrompt && isComponentMounted) {
        console.log("Found existing deferred prompt!");
        setInstallPrompt((window as any).deferredPrompt);
      }
    };

    // Add event listeners immediately
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt, { passive: false });
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check for existing prompt after a brief delay to allow for early event firing
    const timeoutId = setTimeout(checkForExistingPrompt, 100);

    // Cleanup function
    return () => {
      isComponentMounted = false;
      clearTimeout(timeoutId);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []); // Empty dependency array - run only once on mount

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // Show manual installation instructions if no prompt available
      setIsDialogOpen(true);
      return;
    }
    
    try {
      // Trigger the native install prompt
      await installPrompt.prompt();
      
      // Wait for the user's choice
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === "accepted") {
        toast({
          title: "Installation Started",
          description: "Progressly is being installed...",
        });
      }
      
      // Clear the prompt after use
      setInstallPrompt(null);
    } catch (error) {
      console.error("Error during PWA installation:", error);
      toast({
        title: "Installation Error",
        description: "Please try installing manually from your browser menu.",
        variant: "destructive",
      });
    }
  };

  // --- NEW, CORRECTED LOGIC ---

  // 1. If the app is already installed and running in its own window, hide the button.
  if (typeof window !== "undefined" && window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  // 2. If the install prompt event has NOT been captured yet, hide the button.
  //    (We make an exception for iOS devices, which don't fire the event).
  if (!installPrompt && !/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return null;
  }

  // 3. If we pass both checks, it means the app is not installed AND the prompt is available (or it's iOS),
  //    so we can finally show the button.
  return (
    <>
      <Button onClick={handleInstallClick} variant="ghost" size="icon" aria-label="Install App">
        <ArrowDownToLine className="h-5 w-5" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Install Progressly</DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <div><strong>To install Progressly manually:</strong></div>
                <div className="space-y-2 text-sm">
                  <div><strong>Chrome/Edge:</strong> Click the three dots menu (⋮) → "Install Progressly"</div>
                  <div><strong>Mobile:</strong> Tap the menu → "Add to Home screen" or "Install app"</div>
                  <div><strong>Firefox:</strong> Click the menu → "Install"</div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
