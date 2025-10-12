'use client';

import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PieChartData } from '@/lib/types';
import { defaultCategoryHexColors } from '@/lib/constants';
import { CATEGORY_CONFIG } from '@/lib/category-config';

// Shadcn UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// --- Custom Components for the Chart ---

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = Math.floor(data.duration / 60);
    const minutes = Math.round(data.duration % 60);
    const timeString =
      `${hours > 0 ? `${hours}h` : ''} ${
        minutes > 0 ? `${minutes}m` : ''
      }`.trim() || '0m';

    return (
      <div className="p-2 text-sm bg-primary/90 backdrop-blur-sm border border-white/20 rounded-md shadow-lg text-secondary">
        <p className="font-bold" style={{ color: defaultCategoryHexColors[data.name] || data.color }}>
          {data.name}
        </p>
        <p className="text-muted-foreground">{`Total: ${timeString}`}</p>
      </div>
    );
  }
  return null;
};

// A clean, custom legend that works for both charts
const CustomLegend = ({ data }: { data: PieChartData[] }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-sm text-secondary">
    {data.map((entry) => (
      <div key={`legend-${entry.id}`} className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-sm"
          style={{
            backgroundColor: defaultCategoryHexColors[entry.name] || entry.color,
          }}
        />
        <span>{entry.name}</span>
      </div>
    ))}
  </div>
);

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const categoryName = payload.value;

  const getCategoryIcon = (name: string) => {
    const trimmedName = name ? name.trim() : '';
    const config = CATEGORY_CONFIG[trimmedName as keyof typeof CATEGORY_CONFIG];
    if (config && config.icon) {
      return config.icon;
    }
    // Always return a valid icon component
    return CATEGORY_CONFIG["Default"].icon;
  };

  const Icon = getCategoryIcon(categoryName);

  return (
    <g transform={`translate(${x},${y})`}>
        <foreignObject x={-12} y={0} width={24} height={24}>
            <div style={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                <Icon className="w-4 h-4 inline-block" />
            </div>
        </foreignObject>
    </g>
  );
};

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
  data: PieChartData[];
}

export function DailySummaryChart({ selectedDate, data }: DailySummaryChartProps) {
  const [activeTab, setActiveTab] = useState('pie');

  // Calculate total time logged
  const calculateTotalTime = (summaryData: PieChartData[]) => {
    const totalMinutes = summaryData.reduce((sum, item) => sum + item.duration, 0);
    return totalMinutes;
  };

  // Format total minutes into human-readable string
  const formatTotalTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getSummaryTitle = (date: Date) => {
    if (isToday(date)) return 'Summary for Today';
    if (isYesterday(date)) return 'Summary for Yesterday';
    return `Summary for ${format(date, 'EEEE')}`;
  };

  const totalTimeLogged = calculateTotalTime(data);
  const formattedTotalTime = formatTotalTime(totalTimeLogged);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">{getSummaryTitle(selectedDate)}</CardTitle>
        <CardDescription>
          {data.length > 0
            ? `A breakdown of the ${formattedTotalTime} you've logged.`
            : 'No activities logged for this day.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">
              No activities logged for this day.
            </p>
          </div>
        ) : (
          <Tabs
            defaultValue="pie"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="pie"
                className={
                  activeTab === 'pie'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }
              >
                Pie Chart
              </TabsTrigger>
              <TabsTrigger
                value="bar"
                className={
                  activeTab === 'bar'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }
              >
                Bar Chart
              </TabsTrigger>
            </TabsList>

            {/* Pie Chart View */}
            <TabsContent value="pie">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    dataKey="duration"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={defaultCategoryHexColors[entry.name] || entry.color}
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
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={<CustomXAxisTick />}
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
                    cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  />
                  <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                    {data.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={defaultCategoryHexColors[entry.name] || entry.color}
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