"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Loader2, BarChart3, TrendingUp, Brain, Target, Clock, 
  Calendar, Zap, Trophy, ArrowLeft, ArrowUp, ArrowDown, Minus, Lightbulb
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from "recharts";
import { getAnalyticsOverview, getTrendsData, getComparisonData, getDailyHistory } from "./actions";
import { CheckCircle2, XCircle, History } from "lucide-react";

interface OverviewData {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  dailyAverage: number;
  topCategories: { name: string; duration: number }[];
  challengeProgress: { name: string; dayNumber: number; totalDays: number; percentComplete: number } | null;
  activityCount: { today: number; week: number; month: number };
}

interface TrendData {
  date: string;
  total: number;
  [key: string]: string | number;
}

interface ComparisonData {
  category: string;
  color: string;
  target: number;
  actual: number;
  percentage: number;
  difference: number;
}

interface DailyHistoryData {
  date: string;
  dayNumber: number;
  overallCompletion: number;
  hasActivity: boolean;
  commitmentDetails: Array<{
    habit: string;
    target: number | string;
    achieved: number;
    unit: string;
    isComplete: boolean;
  }>;
}

interface ChallengeInfo {
  name: string;
  totalDays: number;
  startDate: string;
  endDate: string;
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [comparison, setComparison] = useState<ComparisonData[]>([]);
  const [dailyHistory, setDailyHistory] = useState<DailyHistoryData[]>([]);
  const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [overviewRes, trendsRes, comparisonRes, historyRes] = await Promise.all([
          getAnalyticsOverview(),
          getTrendsData(30),
          getComparisonData(),
          getDailyHistory(),
        ]);

        if (overviewRes.success && overviewRes.data) {
          setOverview(overviewRes.data);
        }
        if (trendsRes.success && trendsRes.data) {
          setTrends(trendsRes.data);
        }
        if (comparisonRes.success && comparisonRes.data) {
          setComparison(comparisonRes.data);
        }
        if (historyRes.success && historyRes.data) {
          setDailyHistory(historyRes.data);
          if (historyRes.challenge) {
            setChallengeInfo(historyRes.challenge);
          }
        }
      } catch (error) {
        console.error("Error loading analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" />
              Analytics
            </h1>
            <p className="text-sm text-gray-400">Your productivity insights</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 h-auto p-1">
            <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Zap className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex flex-col sm:flex-row items-center gap-1 py-2 text-xs sm:text-sm">
              <Target className="h-4 w-4" />
              <span>Compare</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== OVERVIEW TAB ==================== */}
          <TabsContent value="overview" className="space-y-4">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    Today
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(overview?.todayTotal || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {overview?.activityCount.today || 0} activities
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Calendar className="h-4 w-4" />
                    This Week
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(overview?.weekTotal || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {overview?.activityCount.week || 0} activities
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <TrendingUp className="h-4 w-4" />
                    This Month
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(overview?.monthTotal || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {overview?.activityCount.month || 0} activities
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Zap className="h-4 w-4" />
                    Daily Avg
                  </div>
                  <p className="text-2xl font-bold text-accent">
                    {formatDuration(Math.round(overview?.dailyAverage || 0))}
                  </p>
                  <p className="text-xs text-gray-500">per active day</p>
                </CardContent>
              </Card>
            </div>

            {/* Challenge Progress */}
            {overview?.challengeProgress && (
              <Card className="bg-gradient-to-r from-accent/10 to-blue-500/10 backdrop-blur-xl border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-accent" />
                      <div>
                        <p className="font-semibold text-white">{overview.challengeProgress.name}</p>
                        <p className="text-sm text-gray-400">
                          Day {overview.challengeProgress.dayNumber} of {overview.challengeProgress.totalDays}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">
                        {overview.challengeProgress.percentComplete}%
                      </p>
                      <p className="text-xs text-gray-400">complete</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Categories */}
            <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Top Categories This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overview?.topCategories.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm w-4">{idx + 1}</span>
                        <span className="text-white">{cat.name}</span>
                      </div>
                      <span className="text-gray-400">{formatDuration(cat.duration)}</span>
                    </div>
                  ))}
                  {(!overview?.topCategories || overview.topCategories.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TRENDS TAB ==================== */}
          <TabsContent value="trends" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Daily Activity (Last 30 Days)</CardTitle>
                <CardDescription className="text-gray-400">
                  Total minutes tracked per day
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 10 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis 
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 10 }}
                        tickFormatter={(value) => `${Math.round(value / 60)}h`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number) => [formatDuration(value), 'Total']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#f5c542" 
                        strokeWidth={2}
                        dot={{ fill: '#f5c542', strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 6, fill: '#f5c542' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Summary */}
            <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Weekly Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {trends.length >= 7 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={trends.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 10 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
                        }}
                      />
                      <YAxis 
                        stroke="#666"
                        tick={{ fill: '#999', fontSize: 10 }}
                        tickFormatter={(value) => `${Math.round(value / 60)}h`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [formatDuration(value), 'Total']}
                      />
                      <Bar dataKey="total" fill="#f5c542" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-500">
                    Need at least 7 days of data
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== HISTORY TAB ==================== */}
          <TabsContent value="history" className="space-y-4">
            {/* Challenge Header */}
            {challengeInfo && (
              <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Trophy className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{challengeInfo.name}</p>
                        <p className="text-sm text-gray-400">
                          Day {dailyHistory.length > 0 ? dailyHistory[0].dayNumber : 1} of {challengeInfo.totalDays}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">
                        {dailyHistory.length > 0 ? Math.round(dailyHistory.filter(d => d.overallCompletion >= 70).length / dailyHistory.length * 100) : 0}%
                      </p>
                      <p className="text-xs text-gray-400">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily History Cards - Scrollable */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {dailyHistory.length > 0 ? (
                dailyHistory.map((day) => {
                  const completionColor = day.overallCompletion >= 100 
                    ? 'text-green-400 bg-green-500/10' 
                    : day.overallCompletion >= 70 
                      ? 'text-accent bg-accent/10' 
                      : day.overallCompletion > 0 
                        ? 'text-orange-400 bg-orange-500/10' 
                        : 'text-gray-400 bg-gray-800/50';
                  
                  return (
                    <Card key={day.date} className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                      <CardContent className="py-4">
                        {/* Header: Date & Percentage */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${completionColor}`}>
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {new Date(day.date).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-xs text-gray-500">Day {day.dayNumber}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${day.overallCompletion >= 70 ? 'text-accent' : day.overallCompletion > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                              {day.overallCompletion}%
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-800 rounded-full mb-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              day.overallCompletion >= 100 
                                ? 'bg-green-500' 
                                : day.overallCompletion >= 70 
                                  ? 'bg-accent' 
                                  : day.overallCompletion > 0 
                                    ? 'bg-orange-500' 
                                    : 'bg-gray-700'
                            }`}
                            style={{ width: `${Math.min(day.overallCompletion, 100)}%` }}
                          />
                        </div>

                        {/* Commitments Breakdown */}
                        <div className="space-y-2">
                          {day.commitmentDetails.map((comm, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between text-sm py-1 border-t border-gray-800 first:border-0 first:pt-0"
                            >
                              <div className="flex items-center gap-2">
                                {comm.isComplete ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-gray-300">{comm.habit}</span>
                              </div>
                              <span className={`${comm.isComplete ? 'text-green-400' : 'text-gray-500'}`}>
                                {comm.achieved} / {comm.target} {comm.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
                  <CardContent className="py-12 text-center">
                    <History className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No challenge history yet</p>
                    <p className="text-sm text-gray-500 mt-1">Start a challenge to track your daily progress</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => router.push('/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ==================== COMPARISON TAB ==================== */}
          <TabsContent value="comparison" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Target vs Actual</CardTitle>
                <CardDescription className="text-gray-400">
                  Daily average this week compared to your targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparison.length > 0 ? (
                  <div className="space-y-4">
                    {comparison.map((item) => {
                      const isOver = item.percentage > 100;
                      const isUnder = item.percentage < 80;
                      const StatusIcon = isOver ? ArrowUp : isUnder ? ArrowDown : Minus;
                      const statusColor = isOver ? 'text-green-400' : isUnder ? 'text-red-400' : 'text-gray-400';

                      return (
                        <div key={item.category} className="bg-black/30 p-4 rounded-xl border border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-medium text-white">{item.category}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${statusColor}`}>
                              <StatusIcon className="h-4 w-4" />
                              <span className="text-sm font-semibold">{item.percentage}%</span>
                            </div>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
                            <div 
                              className="absolute h-full bg-gray-600 rounded-full"
                              style={{ width: '100%' }}
                            />
                            <div 
                              className="absolute h-full rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(item.percentage, 100)}%`,
                                backgroundColor: item.color
                              }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Actual: {item.actual}h/day</span>
                            <span>Target: {item.target}h/day</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No targets set yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push('/settings?tab=goals')}
                    >
                      Set Daily Targets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
