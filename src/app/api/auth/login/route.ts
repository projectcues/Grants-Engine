import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  // Resolve base URL taking reverse proxies into account
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'contracts.projectcues.com';
  const forwardedHost = rawHost.split(',')[0].trim();
  const protoHeader = request.headers.get('x-forwarded-proto') || '';
  const forwardedProto = protoHeader.split(',')[0].trim() || 'https';
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

    if (!email || !password) {
      return NextResponse.redirect(
        new URL('/login?error=Email and password are required', baseUrl),
        { status: 303 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, baseUrl),
        { status: 303 }
      );
    }

    // NextResponse.redirect properly forwards Set-Cookie headers
    // from the cookie store, which raw Response() does not
    return NextResponse.redirect(new URL('/', baseUrl), { status: 303 });
  } catch (err: any) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message)}`, baseUrl),
      { status: 303 }
    );
  }
}

