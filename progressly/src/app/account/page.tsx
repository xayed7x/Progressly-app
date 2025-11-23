"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Mail, User as UserIcon } from "lucide-react";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
        </div>
        <Loader2 className="animate-spin h-8 w-8 text-accent z-10" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
        </div>
        <Card className="w-full max-w-md bg-gray-900/50 backdrop-blur-xl border-gray-800 z-10">
          <CardHeader>
            <CardTitle className="text-white">Not Logged In</CardTitle>
            <CardDescription className="text-gray-400">Please log in to view your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full bg-accent text-black hover:bg-accent/90">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-2xl relative z-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Account</h1>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-accent" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Name</label>
                <p className="text-lg text-white">{displayName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-lg text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">User ID</label>
                <p className="text-sm text-gray-500 font-mono">{user.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleLogout} 
                variant="destructive" 
                className="w-full flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
