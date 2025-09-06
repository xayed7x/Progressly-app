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
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      toast({
        title: "App Installed!",
        description: "Progressly has been installed successfully.",
      });
    };

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

  // Always show install button if not installed

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
                <div><strong>To install Progressly:</strong></div>
                <div className="space-y-2 text-sm">
                  <div><strong>Chrome/Edge:</strong> Look for the install icon (⬇️) in the address bar</div>
                  <div><strong>Or:</strong> Click the three dots menu (⋮) → "Install Progressly"</div>
                  <div><strong>Mobile:</strong> Tap the menu → "Add to Home screen" or "Install app"</div>
                </div>
                <div className="text-xs text-blue-600">
                  💡 <strong>Tip:</strong> If you don't see the install icon, try refreshing the page or using incognito mode.
                </div>
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
