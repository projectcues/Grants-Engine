import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  console.log('[POST /api/auth/login] Request received');
  
  // Resolve base URL taking reverse proxies into account
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host') || url.host;
  const protoHeader = request.headers.get('x-forwarded-proto') || '';
  const forwardedProto = protoHeader.split(',')[0].trim() || (request.url.startsWith('https') ? 'https' : 'http');
  const baseUrl = `${forwardedProto}://${forwardedHost}`;

  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';
    let password = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      email = params.get('email') || '';
      password = params.get('password') || '';
    } else {
      const formData = await request.formData();
      email = formData.get('email') as string || '';
      password = formData.get('password') as string || '';
    }

    console.log('[POST /api/auth/login] Attempting login for:', email);

    if (!email || !password) {
      return new Response(null, {
        status: 303,
        headers: {
          'Location': new URL('/login?error=Email and password are required', baseUrl).toString()
        }
      });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('[POST /api/auth/login] Login failed:', error.message);
      return new Response(null, {
        status: 303,
        headers: {
          'Location': new URL(`/login?error=${encodeURIComponent(error.message)}`, baseUrl).toString()
        }
      });
    }

    console.log('[POST /api/auth/login] Login succeeded! User ID:', data.user?.id);
    return new Response(null, {
      status: 303,
      headers: {
        'Location': new URL('/', baseUrl).toString()
      }
    });
  } catch (err: any) {
    console.error('[POST /api/auth/login] Exception:', err);
    return new Response(null, {
      status: 303,
      headers: {
        'Location': new URL(`/login?error=${encodeURIComponent(err.message)}`, baseUrl).toString()
      }
    });
  }
}
