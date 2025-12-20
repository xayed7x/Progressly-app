"use client";

import { useState, useEffect } from "react";
import { TypeAnimation } from "react-type-animation";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Check, Target, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createGoal, saveDailyTarget, getCategories } from "@/app/settings/actions";
import { defaultActivityCategories, defaultCategoryHexColors } from "@/lib/constants";

const onboardingPlaceholders = [
  "Become a Doctor",
  1500,
  "Get admitted into a Medical College",
  1500,
  "Get admitted into a Engineering University",
  1500,
  "Want to learn English Language",
  1500,
];

type Step = 1 | 2;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [goal, setGoal] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [targets, setTargets] = useState<Record<string, { hours: string; minutes: string }>>({});
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
      }
    };
    checkSession();
  }, [router, supabase]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      } else {
        const defaults = defaultActivityCategories.map(name => ({
          name,
          color: defaultCategoryHexColors[name] || "#808080"
        }));
        setCategories(defaults);
      }
    };
    fetchCategories();
  }, []);

  const updateTargetHours = (categoryName: string, hours: string) => {
    setTargets(prev => ({
      ...prev,
      [categoryName]: {
        hours,
        minutes: prev[categoryName]?.minutes || "0"
      }
    }));
  };

  const updateTargetMinutes = (categoryName: string, minutes: string) => {
    setTargets(prev => ({
      ...prev,
      [categoryName]: {
        hours: prev[categoryName]?.hours || "0",
        minutes
      }
    }));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsLoading(true);
    try {
      const result = await createGoal(goal);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage("Saving your targets...");
    
    try {
      const totalCategories = categories.filter(cat => {
        const targetData = targets[cat.name];
        const hours = parseInt(targetData?.hours || "0");
        const minutes = parseInt(targetData?.minutes || "0");
        return (hours + (minutes / 60)) > 0;
      }).length;

      let savedCount = 0;

      // Convert hours/minutes to decimal hours and save
      for (const cat of categories) {
        const targetData = targets[cat.name];
        const hours = parseInt(targetData?.hours || "0");
        const minutes = parseInt(targetData?.minutes || "0");
        const totalHours = hours + (minutes / 60);
        
        if (totalHours > 0) {
          const result = await saveDailyTarget(cat.name, totalHours);
          if (!result.success) {
            throw new Error(result.error);
          }
          savedCount++;
          setLoadingProgress((savedCount / totalCategories) * 100);
        }
      }

      setLoadingMessage("Preparing your dashboard...");
      setLoadingProgress(100);

      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Setup Complete!",
        description: "Welcome to Progressly. Let's start tracking your progress!",
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome to Progressly</h1>
            <div className="flex justify-center gap-2 mb-8">
                <div className={`h-2 w-16 rounded-full transition-colors ${step === 1 ? 'bg-accent' : 'bg-gray-700'}`} />
                <div className={`h-2 w-16 rounded-full transition-colors ${step === 2 ? 'bg-accent' : 'bg-gray-700'}`} />
            </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-3xl"
            >
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold mb-2">The Big Dream</h2>
                <p className="text-gray-400">What is the one major goal you want to achieve?</p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="goal" className="text-gray-300">My Main Goal</Label>
                  <div className="relative">
                    <Input
                        id="goal"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="bg-black/50 border-gray-700 text-white h-14 text-lg focus:border-accent focus:ring-accent placeholder:text-transparent"
                        autoFocus
                    />
                    {!goal && (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center px-3 pointer-events-none">
                            <TypeAnimation
                                sequence={onboardingPlaceholders}
                                wrapper="span"
                                speed={50}
                                repeat={Infinity}
                                className="text-gray-500 text-lg"
                                cursor={true}
                            />
                        </div>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !goal.trim()}
                  className="w-full h-14 text-lg bg-accent text-black hover:bg-accent/90 rounded-xl font-bold"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : (
                    <span className="flex items-center gap-2">
                        Next Step <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-8 rounded-3xl"
            >
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Daily Targets</h2>
                <p className="text-gray-400">How many hours per day will you dedicate?</p>
              </div>

              <div className="space-y-3 mb-8">
                {categories.map((cat) => {
                  const targetData = targets[cat.name] || { hours: "0", minutes: "0" };
                  
                  return (
                    <div
                      key={cat.name}
                      className="bg-black/30 p-5 rounded-xl border border-gray-800"
                    >
                      {/* First row: Category name */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color || '#fff' }}
                          />
                          <span className="font-medium text-white text-lg">{cat.name}</span>
                        </div>
                      </div>

                      {/* Second row: Hours and Minutes inputs */}
                      <div className="flex items-center gap-2">
                        {/* Hours box */}
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            value={targetData.hours}
                            onChange={(e) => updateTargetHours(cat.name, e.target.value)}
                            className="flex-1 bg-black/50 border-gray-700 text-center h-12 text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-400">hrs</span>
                        </div>
                        
                        {/* Minutes box */}
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={targetData.minutes}
                            onChange={(e) => updateTargetMinutes(cat.name, e.target.value)}
                            className="flex-1 bg-black/50 border-gray-700 text-center h-12 text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-400">min</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative">
                <Button
                  onClick={handleStep2Submit}
                  disabled={isLoading}
                  className="w-full h-14 text-lg bg-accent text-black hover:bg-accent/90 rounded-xl font-bold"
                >
                  {!isLoading ? (
                    <span className="flex items-center gap-2">
                      Finish Setup <Check className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {loadingMessage}
                    </span>
                  )}
                </Button>

                {/* Progress bar */}
                {isLoading && (
                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent to-blue-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-center text-sm text-gray-400">
                      {Math.round(loadingProgress)}% complete
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
