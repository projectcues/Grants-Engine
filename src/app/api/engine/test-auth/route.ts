import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  console.log('[test-auth route] Creating client...');
  try {
    const supabase = await createClient();
    console.log('[test-auth route] Client created. Calling signInWithPassword...');
    
    const email = 'lloydpearson@projectcues.com';
    const password = 'Pearson4$';
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('[test-auth route] Auth failed:', error.message);
      return NextResponse.json({ success: false, error: error.message });
    }
    
    console.log('[test-auth route] Auth succeeded! User ID:', data.user?.id);
    return NextResponse.json({ success: true, userId: data.user?.id });
  } catch (err: any) {
    console.error('[test-auth route] Exception caught:', err.message, err.stack);
    return NextResponse.json({ success: false, error: err.message, stack: err.stack });
  }
}
