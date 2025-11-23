"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Edit2, Check, X, Target, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createGoal, saveDailyTarget, getCategories, getGoals, getDailyTargets } from "./actions";
import { defaultActivityCategories, defaultCategoryHexColors } from "@/lib/constants";

export default function GoalsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [goal, setGoal] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editedGoal, setEditedGoal] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editedHours, setEditedHours] = useState("");
  const [editedMinutes, setEditedMinutes] = useState("");
  
  const router = useRouter();
  const { toast } = useToast();

  // Load existing goal and targets
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [goals, dailyTargets, cats] = await Promise.all([
          getGoals(),
          getDailyTargets(),
          getCategories()
        ]);

        if (goals && goals.length > 0) {
          setGoal(goals[0].content);
        }

        if (dailyTargets && dailyTargets.length > 0) {
          const targetsMap: Record<string, number> = {};
          dailyTargets.forEach((target: any) => {
            targetsMap[target.category_name] = target.target_hours;
          });
          setTargets(targetsMap);
        }

        // Always show all default categories, plus any custom categories
        // Create default categories with their colors
        const defaultCategoriesMap = new Map(
          defaultActivityCategories.map(name => [
            name,
            {
              name,
              color: defaultCategoryHexColors[name] || "#808080"
            }
          ])
        );
        
        // If user has created categories, use their colors for matching defaults
        if (cats && cats.length > 0) {
          cats.forEach((cat: any) => {
            if (defaultCategoriesMap.has(cat.name)) {
              // Update default category with user's color if they've customized it
              defaultCategoriesMap.set(cat.name, {
                name: cat.name,
                color: cat.color || defaultCategoryHexColors[cat.name] || "#808080"
              });
            }
          });
          
          // Add any custom categories (not in defaults)
          const customCategories = cats.filter((cat: any) => 
            !defaultActivityCategories.includes(cat.name)
          );
          
          // Combine: all defaults + custom categories
          setCategories([
            ...Array.from(defaultCategoriesMap.values()),
            ...customCategories.map((cat: any) => ({
              name: cat.name,
              color: cat.color || "#808080"
            }))
          ]);
        } else {
          // No user categories yet, just show all defaults
          setCategories(Array.from(defaultCategoriesMap.values()));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveGoal = async () => {
    if (!editedGoal.trim()) return;

    try {
      const formData = new FormData();
      formData.append("goal", editedGoal);
      const result = await createGoal(formData);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setGoal(editedGoal);
      setIsEditingGoal(false);
      toast({
        title: "Goal updated!",
        description: "Your big dream has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveTarget = async (categoryName: string) => {
    const hours = editedHours === "" ? 0 : parseInt(editedHours) || 0;
    const minutes = editedMinutes === "" ? 0 : parseInt(editedMinutes) || 0;
    const totalHours = hours + (minutes / 60);

    // Allow saving 0 hours (to clear a target), but prevent invalid values
    if (totalHours < 0 || totalHours > 24) {
      toast({
        title: "Invalid value",
        description: "Target must be between 0 and 24 hours.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await saveDailyTarget(categoryName, totalHours);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setTargets(prev => ({ ...prev, [categoryName]: totalHours }));
      setEditingTarget(null);
      setEditedHours("");
      setEditedMinutes("");
      toast({
        title: "Target updated!",
        description: `${categoryName} target has been saved.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEditingTarget = (categoryName: string, currentValue: number) => {
    // If current value is 0, start with empty strings instead of "0"
    if (currentValue === 0) {
      setEditedHours("");
      setEditedMinutes("");
    } else {
      const hours = Math.floor(currentValue);
      const minutes = Math.round((currentValue - hours) * 60);
      setEditedHours(hours.toString());
      setEditedMinutes(minutes.toString());
    }
    setEditingTarget(categoryName);
  };

  const cancelEditing = () => {
    setEditingTarget(null);
    setEditedHours("");
    setEditedMinutes("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
        </div>
        <Loader2 className="animate-spin h-8 w-8 text-accent z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-3xl relative z-10 space-y-6 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Goals & Targets</h1>

        {/* Big Dream Card */}
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              The Big Dream
            </CardTitle>
            <CardDescription className="text-gray-400">Your main goal</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditingGoal ? (
              <div className="space-y-4">
                <Input
                  value={editedGoal}
                  onChange={(e) => setEditedGoal(e.target.value)}
                  placeholder="Enter your goal"
                  className="bg-black/50 border-gray-700 text-white h-12 text-lg"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveGoal}
                    className="flex-1 bg-accent text-black hover:bg-accent/90"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditingGoal(false);
                      setEditedGoal("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xl text-white">
                  {goal || "No goal set yet"}
                </p>
                <Button
                  onClick={() => {
                    setEditedGoal(goal);
                    setIsEditingGoal(true);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Targets Card */}
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Daily Targets
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your daily time allocation goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((cat) => {
                const isEditing = editingTarget === cat.name;
                const currentValue = targets[cat.name] || 0;
                const displayHours = Math.floor(currentValue);
                const displayMinutes = Math.round((currentValue - displayHours) * 60);

                return (
                  <div
                    key={cat.name}
                    className="bg-black/30 p-5 rounded-xl border border-gray-800"
                  >
                    {/* First row: Category name and Edit/Save button */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color || '#fff' }}
                        />
                        <span className="font-medium text-white text-lg">{cat.name}</span>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditing) {
                            handleSaveTarget(cat.name);
                          } else {
                            startEditingTarget(cat.name, currentValue);
                          }
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0"
                        type={isEditing ? "button" : "button"}
                      >
                        {isEditing ? (
                          <Check className="h-4 w-4 text-accent" />
                        ) : (
                          <Edit2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Second row: Time input/display */}
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            value={editedHours}
                            onChange={(e) => setEditedHours(e.target.value)}
                            className="flex-1 bg-black/50 border-gray-700 text-center h-12 text-lg text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder=""
                            autoFocus
                          />
                          <span className="text-sm text-gray-400">hrs</span>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={editedMinutes}
                            onChange={(e) => setEditedMinutes(e.target.value)}
                            className="flex-1 bg-black/50 border-gray-700 text-center h-12 text-lg text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder=""
                          />
                          <span className="text-sm text-gray-400">min</span>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => startEditingTarget(cat.name, currentValue)}
                      >
                        {/* Hours box */}
                        <div className="flex-1 bg-black/50 border border-gray-700 rounded-lg h-12 flex items-center justify-center hover:border-accent transition-colors">
                          <span className="text-2xl font-semibold text-white">
                            {displayHours > 0 ? displayHours : "—"}
                          </span>
                          <span className="text-sm text-gray-400 ml-2">hrs</span>
                        </div>
                        
                        {/* Minutes box */}
                        <div className="flex-1 bg-black/50 border border-gray-700 rounded-lg h-12 flex items-center justify-center hover:border-accent transition-colors">
                          <span className="text-2xl font-semibold text-white">
                            {displayMinutes > 0 ? displayMinutes : "—"}
                          </span>
                          <span className="text-sm text-gray-400 ml-2">min</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}