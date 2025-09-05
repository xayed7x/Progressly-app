"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { format, isToday, isYesterday } from "date-fns";
import useSWR from "swr";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getDailySummary } from "@/lib/apiClient";
import { DailySummaryItem } from "@/lib/types";

// Shadcn UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// --- Custom Components for the Chart ---

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = Math.floor(data.total_duration_minutes / 60);
    const minutes = Math.round(data.total_duration_minutes % 60);
    const timeString =
      `${hours > 0 ? `${hours}h` : ""} ${
        minutes > 0 ? `${minutes}m` : ""
      }`.trim() || "0m";

    return (
      <div className="p-2 text-sm bg-primary/90 backdrop-blur-sm border border-white/20 rounded-md shadow-lg text-secondary">
        <p className="font-bold" style={{ color: data.category_color }}>
          {data.category_name}
        </p>
        <p className="text-muted-foreground">{`Total: ${timeString}`}</p>
      </div>
    );
  }
  return null;
};

// A clean, custom legend that works for both charts
const CustomLegend = ({ data }: { data: DailySummaryItem[] }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-sm text-secondary">
    {data.map((entry) => (
      <div
        key={`legend-${entry.category_id}`}
        className="flex items-center gap-2"
      >
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: entry.category_color }}
        />
        <span>{entry.category_name}</span>
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64 mt-1" />
    </CardHeader>
    <CardContent className="flex items-center justify-center">
      <Skeleton className="h-[350px] w-full" />
    </CardContent>
  </Card>
);

// --- Main Chart Component ---

interface DailySummaryChartProps {
  selectedDate: Date;
}

export function DailySummaryChart({ selectedDate }: DailySummaryChartProps) {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("pie"); // New state for active tab

  // Create a fetcher function for useSWR
  const fetcher = async (url: string) => {
    const token = await getToken();
    if (!token) {
      throw new Error("User is not authenticated.");
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    return res.json();
  };

  // Format the date for the API call
  const dateString = selectedDate.toISOString().split("T")[0];
  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/summary/daily/${dateString}`;

  // Use useSWR with single string key that changes when selectedDate changes
  const { data = [], error, isLoading } = useSWR<DailySummaryItem[]>(
    apiUrl,
    fetcher
  );

  if (isLoading) return <ChartSkeleton />;
  if (error) return <div className="text-red-500 p-4 text-center">Could not load summary data.</div>;

  const getSummaryTitle = (date: Date) => {
    if (isToday(date)) return "Today's Summary";
    if (isYesterday(date)) return "Yesterday's Summary";
    return `${format(date, "EEEE")}'s Summary`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">{getSummaryTitle(selectedDate)}</CardTitle>
        <CardDescription>
          A breakdown of your logged activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">
              No activities logged for today.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="pie" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pie" className={activeTab === "pie" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}>Pie Chart</TabsTrigger>
              <TabsTrigger value="bar" className={activeTab === "bar" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}>Bar Chart</TabsTrigger>
            </TabsList>

            {/* Pie Chart View */}
            <TabsContent value="pie">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    dataKey="total_duration_minutes"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={`cell-${entry.category_id}`}
                        fill={entry.category_color}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <CustomLegend data={data} />
            </TabsContent>

            {/* Bar Chart View */}
            <TabsContent value="bar">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={data}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  
                  {/* FIX: Use a theme-aware color for axis text */}
                  <XAxis
                    dataKey="category_name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}m`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                  />
                  <Bar dataKey="total_duration_minutes" radius={[4, 4, 0, 0]}>
                    {data.map((entry) => (
                      <Cell
                        key={`cell-${entry.category_id}`}
                        fill={entry.category_color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <CustomLegend data={data} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
