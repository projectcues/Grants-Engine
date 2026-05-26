import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  console.log('[POST /api/auth/login] Request received');
  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';
    let password = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else {
      const formData = await request.formData();
      email = formData.get('email') as string;
      password = formData.get('password') as string;
    }

    console.log('[POST /api/auth/login] Attempting login for:', email);

    if (!email || !password) {
      return NextResponse.redirect(new URL('/login?error=Email and password are required', request.url), 303);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('[POST /api/auth/login] Login failed:', error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url), 303);
    }

    console.log('[POST /api/auth/login] Login succeeded! User ID:', data.user?.id);
    return NextResponse.redirect(new URL('/', request.url), 303);
  } catch (err: any) {
    console.error('[POST /api/auth/login] Exception:', err);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, request.url), 303);
  }
}
