// In /progressly/src/lib/supabase-client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './types_db';

// Define a function to create the client, ensuring it's a singleton.
let supabase: ReturnType<typeof createClientComponentClient<Database>>;

export const getSupabaseBrowserClient = () => {
  if (!supabase) {
    supabase = createClientComponentClient<Database>();
  }
  return supabase;
};