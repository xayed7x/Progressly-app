"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, LogOut, Mail, User as UserIcon, Settings, Target, Clock, 
  Edit2, Check, X, Plus, Trash2, AlertTriangle, Trophy, Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defaultActivityCategories, defaultCategoryHexColors } from "@/lib/constants";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getGoals, createGoal,
  getDailyTargets, saveDailyTarget,
  getActiveChallenge, updateChallenge, abandonChallenge
} from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id?: number;
  name: string;
  color: string;
}

interface Challenge {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: string;
  commitments: any[];
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("account");
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#808080");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Goals state
  const [goal, setGoal] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editedGoal, setEditedGoal] = useState("");
  
  // Targets state
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editedHours, setEditedHours] = useState("");
  const [editedMinutes, setEditedMinutes] = useState("");
  
  // Challenge state
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [isEditingChallengeName, setIsEditingChallengeName] = useState(false);
  const [editedChallengeName, setEditedChallengeName] = useState("");
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Load all data in parallel
        const [cats, goals, dailyTargets, activeChallenge] = await Promise.all([
          getCategories(),
          getGoals(),
          getDailyTargets(),
          getActiveChallenge()
        ]);

        // Process categories
        const defaultCats = defaultActivityCategories.map(name => ({
          name,
          color: defaultCategoryHexColors[name] || "#808080"
        }));
        
        if (cats && cats.length > 0) {
          // Merge with user's categories
          const catMap = new Map<string, Category>();
          defaultCats.forEach(c => catMap.set(c.name, c));
          cats.forEach((c: Category) => catMap.set(c.name, c));
          setCategories(Array.from(catMap.values()));
        } else {
          setCategories(defaultCats);
        }

        // Process goals
        if (goals && goals.length > 0) {
          setGoal(goals[0].content);
        }

        // Process targets
        if (dailyTargets && dailyTargets.length > 0) {
          const targetsMap: Record<string, number> = {};
          dailyTargets.forEach((t: any) => {
            targetsMap[t.category_name] = t.target_hours;
          });
          setTargets(targetsMap);
        }

        // Process challenge
        if (activeChallenge) {
          setChallenge(activeChallenge);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // ==================== GOAL HANDLERS ====================
  const handleSaveGoal = async () => {
    if (!editedGoal.trim()) return;
    
    const result = await createGoal(editedGoal);
    if (result.success) {
      setGoal(editedGoal);
      setIsEditingGoal(false);
      toast({ title: "Goal saved!", description: "Your big dream has been updated." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  // ==================== TARGET HANDLERS ====================
  const handleSaveTarget = async (categoryName: string) => {
    const hours = editedHours === "" ? 0 : parseInt(editedHours) || 0;
    const minutes = editedMinutes === "" ? 0 : parseInt(editedMinutes) || 0;
    const totalHours = hours + (minutes / 60);

    if (totalHours < 0 || totalHours > 24) {
      toast({ title: "Invalid value", description: "Target must be between 0 and 24 hours.", variant: "destructive" });
      return;
    }

    const result = await saveDailyTarget(categoryName, totalHours);
    if (result.success) {
      setTargets(prev => ({ ...prev, [categoryName]: totalHours }));
      setEditingTarget(null);
      toast({ title: "Target saved!", description: `${categoryName} target updated.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const startEditingTarget = (categoryName: string, currentValue: number) => {
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

  // ==================== CATEGORY HANDLERS ====================
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const result = await createCategory(newCategoryName, newCategoryColor);
    if (result.success) {
      setCategories(prev => [...prev, { name: newCategoryName, color: newCategoryColor, ...result.data }]);
      setNewCategoryName("");
      setNewCategoryColor("#808080");
      setShowAddCategory(false);
      toast({ title: "Category added!", description: `${newCategoryName} has been created.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete?.id) return;
    
    const result = await deleteCategory(categoryToDelete.id);
    if (result.success) {
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
      toast({ title: "Category deleted", description: `${categoryToDelete.name} has been removed.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  // ==================== CHALLENGE HANDLERS ====================
  const handleSaveChallengeName = async () => {
    if (!challenge || !editedChallengeName.trim()) return;
    
    const result = await updateChallenge(challenge.id, { name: editedChallengeName });
    if (result.success) {
      setChallenge(prev => prev ? { ...prev, name: editedChallengeName } : null);
      setIsEditingChallengeName(false);
      toast({ title: "Challenge updated!", description: "Name has been changed." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleAbandonChallenge = async () => {
    if (!challenge) return;
    
    const result = await abandonChallenge(challenge.id);
    if (result.success) {
      setChallenge(null);
      setShowAbandonDialog(false);
      toast({ title: "Challenge ended", description: "Your challenge has been abandoned." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
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

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-accent" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 h-auto p-1">
            <TabsTrigger value="account" className="flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] sm:text-xs sm:flex-row sm:gap-1.5">
              <UserIcon className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="challenge" className="flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] sm:text-xs sm:flex-row sm:gap-1.5">
              <Trophy className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Challenge</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] sm:text-xs sm:flex-row sm:gap-1.5">
              <Palette className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] sm:text-xs sm:flex-row sm:gap-1.5">
              <Target className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Goals</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== ACCOUNT TAB ==================== */}
          <TabsContent value="account" className="space-y-6">
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
                  <p className="text-lg text-white">{user?.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Account Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleLogout} variant="destructive" className="w-full flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== CHALLENGE TAB ==================== */}
          <TabsContent value="challenge" className="space-y-6">
            {challenge ? (
              <>
                <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-accent" />
                      Active Challenge
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Day {Math.ceil((Date.now() - new Date(challenge.start_date).getTime()) / (1000 * 60 * 60 * 24))} of {challenge.duration_days}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Challenge Name */}
                    <div>
                      <label className="text-sm text-gray-400">Challenge Name</label>
                      {isEditingChallengeName ? (
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={editedChallengeName}
                            onChange={(e) => setEditedChallengeName(e.target.value)}
                            className="bg-black/50 border-gray-700 text-white"
                            autoFocus
                          />
                          <Button size="icon" onClick={handleSaveChallengeName}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => setIsEditingChallengeName(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-lg text-white">{challenge.name}</p>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditedChallengeName(challenge.name);
                              setIsEditingChallengeName(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Start Date</label>
                        <p className="text-white">{new Date(challenge.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">End Date</label>
                        <p className="text-white">{new Date(challenge.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Commitments */}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Commitments</label>
                      <div className="space-y-2">
                        {challenge.commitments?.map((commitment: any, idx: number) => (
                          <div key={idx} className="bg-black/30 p-3 rounded-lg border border-gray-800">
                            <p className="text-white">
                              {commitment.habit}: {commitment.target} {commitment.unit || ''} {commitment.frequency}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-red-950/30 backdrop-blur-xl border-red-900/50">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-600 text-orange-400 hover:bg-orange-600/10"
                      onClick={() => router.push('/dashboard?newChallenge=true')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Challenge
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Starting a new challenge will end your current one
                    </p>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => setShowAbandonDialog(true)}
                    >
                      Abandon Challenge
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No active challenge</p>
                  <Button className="mt-4" onClick={() => router.push('/dashboard')}>
                    Start a New Challenge
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ==================== CATEGORIES TAB ==================== */}
          <TabsContent value="categories" className="space-y-6">
            <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Palette className="h-5 w-5 text-accent" />
                    Categories
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your activity categories
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowAddCategory(true)}
                  className="bg-accent text-black hover:bg-accent/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {/* Add Category Form */}
                {showAddCategory && (
                  <div className="bg-black/30 p-4 rounded-lg border border-gray-800 mb-4">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-sm text-gray-400">Name</label>
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Category name"
                          className="bg-black/50 border-gray-700 text-white"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-sm text-gray-400">Color</label>
                        <input
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                      <Button onClick={handleAddCategory}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Categories List */}
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div 
                      key={cat.name} 
                      className="bg-black/30 p-3 rounded-lg border border-gray-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-white">{cat.name}</span>
                      </div>
                      {cat.id && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-red-400 hover:text-red-300"
                          onClick={() => setCategoryToDelete(cat)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== GOALS TAB ==================== */}
          <TabsContent value="goals" className="space-y-6">
            {/* Big Goal */}
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
                      <Button onClick={handleSaveGoal} className="flex-1 bg-accent text-black hover:bg-accent/90">
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={() => setIsEditingGoal(false)} variant="outline" className="flex-1">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xl text-white">{goal || "No goal set yet"}</p>
                    <Button onClick={() => { setEditedGoal(goal); setIsEditingGoal(true); }} variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Targets */}
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
                      <div key={cat.name} className="bg-black/30 p-4 rounded-xl border border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="font-medium text-white">{cat.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => isEditing ? handleSaveTarget(cat.name) : startEditingTarget(cat.name, currentValue)}
                          >
                            {isEditing ? <Check className="h-4 w-4 text-accent" /> : <Edit2 className="h-4 w-4" />}
                          </Button>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="24"
                              value={editedHours}
                              onChange={(e) => setEditedHours(e.target.value)}
                              className="flex-1 bg-black/50 border-gray-700 text-center h-12 text-lg text-white"
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
                              className="flex-1 bg-black/50 border-gray-700 text-center h-12 text-lg text-white"
                              placeholder=""
                            />
                            <span className="text-sm text-gray-400">min</span>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => startEditingTarget(cat.name, currentValue)}
                          >
                            <div className="flex-1 bg-black/50 border border-gray-700 rounded-lg h-12 flex items-center justify-center hover:border-accent transition-colors">
                              <span className="text-2xl font-semibold text-white">
                                {displayHours > 0 ? displayHours : "—"}
                              </span>
                              <span className="text-sm text-gray-400 ml-2">hrs</span>
                            </div>
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Category Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{categoryToDelete?.name}"? 
              Activities with this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Abandon Challenge Dialog */}
      <AlertDialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Abandon Challenge?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will end your current challenge. Your progress will be saved but the challenge will be marked as abandoned.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAbandonChallenge}
              className="bg-red-600 hover:bg-red-700"
            >
              Abandon Challenge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
