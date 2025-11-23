"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkOnboardingStatus } from "@/app/onboarding/actions";

type AuthView = "welcome" | "signin" | "signup";

export default function AuthCard() {
  const [view, setView] = useState<AuthView>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      router.refresh();
      
      const hasCompletedOnboarding = await checkOnboardingStatus();
      if (hasCompletedOnboarding) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      toast({
        title: "Account Created",
        description: "Please check your email to confirm your account.",
      });
      setView("signin");
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isWelcome = view === "welcome";

  return (
    <motion.div
      className={`absolute bottom-0 left-0 right-0 rounded-t-[2.5rem] p-8 z-20 transition-all duration-500 ${
        isWelcome ? "bg-transparent" : "bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] min-h-[50vh]"
      }`}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <AnimatePresence mode="wait">
        {view === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 flex flex-col items-center mb-12"
          >
            <Button
              onClick={() => setView("signin")}
              className="w-full h-14 text-lg rounded-full bg-transparent border-2 border-white text-white hover:bg-white/10 transition-all"
            >
              Sign In
            </Button>

            <Button
              onClick={() => setView("signup")}
              className="w-full h-14 text-lg rounded-full bg-accent border-2 border-accent text-black hover:bg-accent/90 transition-all"
            >
              Sign Up
            </Button>
          </motion.div>
        )}

        {view === "signin" && (
          <motion.div
            key="signin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("welcome")}
                className="absolute left-6 top-6 rounded-full hover:bg-gray-800"
              >
                <ArrowLeft className="h-6 w-6 text-white" />
              </Button>
              <div className="w-full text-center">
                <h2 className="text-2xl font-bold text-white">Sign In</h2>
              </div>
            </div>

            {/* Google Login - Prominent */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-14 text-lg rounded-xl bg-white text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative w-full py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-2 text-gray-400">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="hello@example.com"
                    className="pl-10 h-12 bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-accent focus:ring-accent rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-accent focus:ring-accent rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="link" className="text-xs text-gray-400 px-0 h-auto hover:text-accent">
                    Forgot Password?
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg rounded-xl bg-accent text-black hover:bg-accent/90 transition-all mt-4"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </motion.div>
        )}

        {view === "signup" && (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("welcome")}
                className="absolute left-6 top-6 rounded-full hover:bg-gray-800"
              >
                <ArrowLeft className="h-6 w-6 text-white" />
              </Button>
              <div className="w-full text-center">
                <h2 className="text-2xl font-bold text-white">Create Account</h2>
              </div>
            </div>

            {/* Google Signup - Prominent */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-14 text-lg rounded-xl bg-white text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative w-full py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900 px-2 text-gray-400">Or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-white font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10 h-12 bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-accent focus:ring-accent rounded-xl"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-signup" className="text-white font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="hello@example.com"
                    className="pl-10 h-12 bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-accent focus:ring-accent rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-signup" className="text-white font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password-signup"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-accent focus:ring-accent rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg rounded-xl bg-accent text-black hover:bg-accent/90 transition-all mt-4"
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Account"}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
