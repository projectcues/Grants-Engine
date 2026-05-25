import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dbzbsqreymotzovhgodv.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6uqdCowX0KaUFIczVnP-2A_06caOPEM',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          console.log('[Supabase Server Client] setAll called with cookies:', cookiesToSet.map(c => c.name));
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log(`[Supabase Server Client] Setting cookie: ${name}`);
              cookieStore.set(name, value, options)
            });
            console.log('[Supabase Server Client] setAll completed successfully');
          } catch (err) {
            console.error('[Supabase Server Client] setAll ERROR:', err);
          }
        },
      },
      global: {
        fetch: async (url, options) => {
          console.log(`[Supabase Server Fetch] URL: ${url}`);
          try {
            const res = await fetch(url, {
              ...options,
              cache: 'no-store',
            });
            console.log(`[Supabase Server Fetch] Response: ${res.status} ${res.statusText}`);
            return res;
          } catch (err) {
            console.error('[Supabase Server Fetch] ERROR:', err);
            throw err;
          }
        }
      }
    }
  );
}
