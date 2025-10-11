export type Activity = {
  id: string;
  activity_name: string;
  start_time: string;
  end_time: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  activity_date: string;
};

export type Category = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  color: string;
};

export type ActivityReadWithCategory = Activity & {
  category: Category | null;
};

export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  status?: 'pending' | 'sent';
};

export type DailySummaryItem = {
  category_id: number;
  category_name: string;
  category_color: string;
  total_duration_minutes: number;
};

export interface PieChartData {
  id: number;
  name: string;
  duration: number;
  color: string;
}

export interface DashboardBootstrapData {
  activities_last_3_days: ActivityReadWithCategory[];
  pie_chart_data: PieChartData[];
  last_end_time: string | null;
  categories: Category[];
}