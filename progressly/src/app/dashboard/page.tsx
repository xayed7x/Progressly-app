import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/types_db';

import DashboardClientPage from "./DashboardClientPage";

export default async function DashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies: () => cookies() });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  return <DashboardClientPage />;
}