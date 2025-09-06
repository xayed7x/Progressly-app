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
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setShowButton(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowButton(false);
      toast({
        title: "App Installed!",
        description: "Progressly has been installed successfully.",
      });
    };

    // Check if we're in a supported browser
    const isSupportedBrowser = /Chrome|Edge|Safari|Firefox/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Show button for iOS or supported browsers
    if (isIOS || isSupportedBrowser) {
      setShowButton(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);

    if (!installPrompt) {
      // Show instructions for manual installation
      setIsDialogOpen(true);
      return;
    }
    setIsDialogOpen(true);
  };

  const handleNativePrompt = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
    }
    setIsDialogOpen(false);
  };

  const handleManualInstall = () => {
    // Try to trigger install prompt manually
    if (installPrompt) {
      installPrompt.prompt();
    } else {
      // Show toast with instructions
      toast({
        title: "Manual Installation Required",
        description: "Please use your browser's install option (address bar icon or menu).",
        duration: 5000,
      });
    }
    setIsDialogOpen(false);
  };

  // Don't show button if already installed
  if (isInstalled) {
    return null;
  }

  // TEMPORARY: Always show button for debugging
  // TODO: Remove this after testing
  console.log('InstallPwaButton render:', { showButton, installPrompt, isInstalled });
  
  // Show button if conditions are met OR for debugging
  if (!showButton && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={handleInstallClick} variant="ghost" size="icon" aria-label="Install App">
          <ArrowDownToLine className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Install Progressly</DialogTitle>
          <DialogDescription asChild>
            {installPrompt ? (
              <span>Click the button below to install Progressly on your device.</span>
            ) : (
              <div className="space-y-3">
                <div><strong>To install this app:</strong></div>
                <div className="space-y-2 text-sm">
                  <div><strong>Chrome/Edge:</strong> Look for the install icon (⬇️) in the address bar, or click the three dots menu → "Install Progressly"</div>
                  <div><strong>Mobile Chrome:</strong> Tap the menu (⋮) → "Add to Home screen" or "Install app"</div>
                  <div><strong>iOS Safari:</strong> Tap the Share button (□↗) → "Add to Home Screen"</div>
                  <div><strong>Firefox:</strong> Look for the install icon in the address bar</div>
                </div>
                <div className="text-xs text-gray-500">Note: The install prompt may not appear in development mode. Try building for production or using HTTPS.</div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {installPrompt ? (
            <Button onClick={handleNativePrompt} className="bg-accent text-accent-foreground hover:bg-accent">
              Install App
            </Button>
          ) : (
            <Button onClick={handleManualInstall} className="bg-accent text-accent-foreground hover:bg-accent">
              Try Install
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
