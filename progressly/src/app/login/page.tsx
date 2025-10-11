// In /progressly/src/app/login/page.tsx
'use client';

import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
// CORRECTED IMPORT: We are now importing from the 'react' helpers package
import { useUser } from '@supabase/auth-helpers-react';

export default function LoginPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const user = useUser();

  // This useEffect will redirect the user to the dashboard if they are already logged in.
  // It will start working correctly AFTER we add the main Supabase provider in the next step.
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8">
        <Auth
          supabaseClient={supabase as any}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={['github', 'google']} // Optional: Add social providers
          // This callback route is the final piece we need to build.
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
        />
      </div>
    </div>
  );
}