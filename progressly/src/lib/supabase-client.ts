// In /progressly/src/lib/supabase-client.ts
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './types_db'; // We will create this type definition later

// Note: The `createPagesBrowserClient` is designed to work in the browser,
// and is the correct client for the Next.js App Router.
// We will use a different client for Server Components and Route Handlers later.

// Define a function to create the client, ensuring it's a singleton.
let supabase: ReturnType<typeof createPagesBrowserClient<Database>>;

export const getSupabaseBrowserClient = () => {
  if (!supabase) {
    supabase = createPagesBrowserClient<Database>();
  }
  return supabase;
};