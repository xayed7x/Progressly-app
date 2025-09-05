// src/lib/types.ts

// This defines the structure of a single Category object
// as it comes from our FastAPI backend.
export interface Category {
  id: number;
  name: string;
  color: string;
  is_default: boolean;
}

// This defines the new structure of a single Activity object.
// Notice how it now contains a nested 'category' object.
export interface Activity {
  id: number;
  activity_name: string;
  start_time: string;
  end_time: string;
  activity_date: string;
  category_id: number | null;
  category: Category | null; // The nested category object
}
