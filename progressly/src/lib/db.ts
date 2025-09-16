import Dexie, { Table } from 'dexie';

// TypeScript interface for QueuedActivity
export interface QueuedActivity {
  id?: number; // Optional because it's auto-incrementing
  activity_name: string;
  start_time: string;
  end_time: string;
  category_id: number | null;
}

// Auth Token Interface
export interface AuthToken {
    id: string; // e.g., 'fastapi-token'
    token: string;
    timestamp: number;
}


// Database class extending Dexie
export class ProgresslyDB extends Dexie {
  // Declare table with strong typing
  queued_activities!: Table<QueuedActivity>;
  auth_token!: Table<AuthToken>;

  constructor() {
    super('progressly');
    
    // Define database schema
    this.version(1).stores({
      queued_activities: '++id, activity_name, start_time'
    });

    this.version(2).stores({
        queued_activities: '++id,activity_name,start_time,end_time,category_id',
        auth_token: 'id'
    });
  }
}

// Export singleton database instance
export const db = new ProgresslyDB();