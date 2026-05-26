import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const headersObj: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  let rawFetchResult = null;
  try {
    const res = await fetch('https://dbzbsqreymotzovhgodv.supabase.co/auth/v1/health', {
      headers: {
        'apikey': 'sb_publishable_6uqdCowX0KaUFIczVnP-2A_06caOPEM'
      }
    });
    rawFetchResult = {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      body: await res.text()
    };
  } catch (err: any) {
    rawFetchResult = { error: err.message, stack: err.stack };
  }

  return NextResponse.json({
    headers: headersObj,
    rawFetchResult,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
    NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL || 'not set',
    SUPABASE_ANON_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY_EXISTS: !!process.env.OPENROUTER_API_KEY,
    AMPLITUDE_API_KEY_EXISTS: !!process.env.AMPLITUDE_API_KEY,
    NODE_ENV: process.env.NODE_ENV || 'not set',
  });
}
