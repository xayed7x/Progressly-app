"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { checkOnboardingStatus } from "@/app/onboarding/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export default function VerifyAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying session...");

  useEffect(() => {
    const verify = async () => {
      const supabase = getSupabaseBrowserClient();
      
      // 1. Ensure we have a session on the client
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If no session, something went wrong with the callback
        console.error("No session found in verify page");
        router.replace("/?error=no_session");
        return;
      }

      setStatus("Checking onboarding status...");

      // 2. Check onboarding status via server action
      try {
        const hasCompletedOnboarding = await checkOnboardingStatus();
        
        if (hasCompletedOnboarding) {
          router.replace("/dashboard");
        } else {
          router.replace("/onboarding");
        }
      } catch (error) {
        console.error("Error checking status:", error);
        // Fallback to dashboard if check fails
        router.replace("/dashboard");
      }
    };

    verify();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
      <p className="text-gray-400">{status}</p>
    </div>
  );
}
