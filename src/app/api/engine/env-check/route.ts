import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const headersObj: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  let authResult = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'lloydpearson@projectcues.com',
      password: 'Pearson4$',
    });
    if (error) {
      authResult = { success: false, error: error.message };
    } else {
      authResult = { success: true, userId: data.user.id };
    }
  } catch (err: any) {
    authResult = { success: false, exception: err.message, stack: err.stack };
  }

  return NextResponse.json({
    headers: headersObj,
    authResult,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL || 'not set',
    SUPABASE_ANON_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV || 'not set',
  });
}
