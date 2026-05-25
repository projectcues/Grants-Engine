import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { fetch as undiciFetch } from 'undici';

export async function updateSession(request: NextRequest) {
  console.log('updateSession middleware started for path:', request.nextUrl.pathname, 'Method:', request.method);
  if (request.method === 'POST') {
    console.log('Skipping session check for POST request to prevent body stream closure');
    return NextResponse.next();
  }

  try {
    let supabaseResponse = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dbzbsqreymotzovhgodv.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6uqdCowX0KaUFIczVnP-2A_06caOPEM',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            console.log('setAll cookies in middleware:', cookiesToSet.map(c => c.name));
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
        global: {
          fetch: async (url, options) => {
            console.log(`[Supabase Middleware Fetch] URL: ${url}`);
            try {
              const res = await undiciFetch(url as any, options as any);
              console.log(`[Supabase Middleware Fetch] Response: ${res.status} ${res.statusText}`);
              return res as any;
            } catch (err) {
              console.error('[Supabase Middleware Fetch] ERROR:', err);
              throw err;
            }
          }
        }
      }
    );

    console.log('Calling supabase.auth.getUser() in middleware...');
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.log('getUser in middleware returned error:', error.message);
    } else {
      console.log('getUser in middleware succeeded. User ID:', user?.id || 'null');
    }

    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/api/engine')
    ) {
      console.log('Redirecting unauthenticated request to /login');
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // If user is logged in and trying to access /login, redirect to /
    if (user && request.nextUrl.pathname === '/login') {
      console.log('Redirecting authenticated request from /login to /');
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (err) {
    console.error('Exception caught in updateSession middleware:', err);
    throw err;
  }
}
