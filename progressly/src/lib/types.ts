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
  category: Category;
};

export type DailySummaryItem = {
  category_id: number;
  category_name: string;
  category_color: string;
  total_duration_minutes: number;
};