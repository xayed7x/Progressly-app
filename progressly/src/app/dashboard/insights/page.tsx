'use client';

import { useAuth } from '@clerk/nextjs';
import useSWR from 'swr';
import { DailySummaryChart, ChartSkeleton } from '../_components/DailySummaryChart';
import { DailySummaryItem, PieChartData } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export default function InsightsPage() {
  const { getToken } = useAuth();

  const fetcher = async (url: string) => {
    const token = await getToken({ template: 'fastapi' });
    if (!token) {
      throw new Error('User is not authenticated.');
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    return res.json();
  };

  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const { data: summaryData, isLoading } = useSWR<DailySummaryItem[]>(
    `${API_BASE_URL}/api/summary/daily/${dateString}`,
    fetcher
  );

  const chartData: PieChartData[] | undefined = summaryData?.map(item => ({
      id: item.category_id,
      name: item.category_name,
      duration: item.total_duration_minutes,
      color: item.category_color,
  }));

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-serif text-secondary mb-2">Your Insights</h1>
      <p className="text-secondary mb-8">
        A visual summary of how you invest your time.
      </p>

      <div className="max-w-4xl mx-auto">
        {isLoading || !chartData ? (
          <ChartSkeleton />
        ) : (
          <DailySummaryChart selectedDate={today} data={chartData} />
        )}
      </div>
    </div>
  );
}
