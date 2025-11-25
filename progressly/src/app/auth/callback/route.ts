import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/types_db';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

async function checkOnboardingStatus(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/onboarding-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.has_completed_onboarding || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(requestUrl.origin + '/?error=auth_failed');
    }

    if (data.session) {
      // Check onboarding status
      const hasCompletedOnboarding = await checkOnboardingStatus(data.session.access_token);
      
      if (hasCompletedOnboarding) {
        return NextResponse.redirect(requestUrl.origin + '/dashboard');
      } else {
        return NextResponse.redirect(requestUrl.origin + '/onboarding');
      }
    }
  }

  // If no code or session, redirect to home
  return NextResponse.redirect(requestUrl.origin + '/');
}