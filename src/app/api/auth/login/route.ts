import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  console.log('[POST /api/auth/login] Request received');
  console.log('[POST /api/auth/login] request.url:', request.url);
  console.log('[POST /api/auth/login] x-forwarded-host:', request.headers.get('x-forwarded-host'));
  console.log('[POST /api/auth/login] host:', request.headers.get('host'));
  console.log('[POST /api/auth/login] x-forwarded-proto:', request.headers.get('x-forwarded-proto'));

  // Resolve base URL taking reverse proxies into account
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'grants.projectcues.com';
  const forwardedHost = rawHost.split(',')[0].trim();
  const protoHeader = request.headers.get('x-forwarded-proto') || '';
  const forwardedProto = protoHeader.split(',')[0].trim() || 'https';
  const baseUrl = `${forwardedProto}://${forwardedHost}`;

  console.log('[POST /api/auth/login] resolved baseUrl:', baseUrl);

  let url: URL;
  try {
    url = new URL(request.url);
  } catch (e) {
    console.log('[POST /api/auth/login] request.url is relative, parsing with baseUrl');
    url = new URL(request.url, baseUrl);
  }

  console.log('[POST /api/auth/login] parsed url:', url.toString());

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
