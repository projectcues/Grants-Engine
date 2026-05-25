import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dbzbsqreymotzovhgodv.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiemJzcXJleW1vdHpvdmhnb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTg5NTksImV4cCI6MjA5MzEzNDk1OX0.sb_publishable_6uqdCowX0KaUFIczVnP-2A_06caOPEM'
  );
}
