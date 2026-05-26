import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  console.log('[POST /api/auth/signup] Request received');
  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';
    let password = '';
    let fullName = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
      fullName = body.full_name || '';
    } else {
      const formData = await request.formData();
      email = formData.get('email') as string;
      password = formData.get('password') as string;
      fullName = formData.get('full_name') as string || '';
    }

    console.log('[POST /api/auth/signup] Attempting signup for:', email);

    if (!email || !password) {
      return NextResponse.redirect(new URL('/login?error=Email and password are required', request.url), 303);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      console.log('[POST /api/auth/signup] Signup failed:', error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url), 303);
    }

    console.log('[POST /api/auth/signup] Signup succeeded!');
    return NextResponse.redirect(new URL('/', request.url), 303);
  } catch (err: any) {
    console.error('[POST /api/auth/signup] Exception:', err);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message)}`, request.url), 303);
  }
}
