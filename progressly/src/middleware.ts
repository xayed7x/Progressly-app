import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

async function checkOnboardingStatus(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/onboarding-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/auth/callback'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user has a session
  if (session) {
    // If accessing login page or homepage, redirect based on onboarding status
    if (pathname === '/login' || pathname === '/') {
      const hasCompletedOnboarding = await checkOnboardingStatus(session.access_token);
      
      // If user has completed onboarding (has goals), send to dashboard
      // If user is new (no goals), send to onboarding
      if (hasCompletedOnboarding) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } else {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }
    
    // Allow access to all other routes for authenticated users
    return res;
  }

  // If no session and trying to access protected route
  if (!isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  /*
   * Match all page routes. This will exclude static assets like
   * manifest.json, sw-custom.js, and images from the middleware.
   */
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/onboarding',
    '/account/:path*',
    '/chat/:path*',
    '/contact/:path*',
    '/features/:path*',
    '/goals/:path*',
    '/auth/:path*',
  ]
}
