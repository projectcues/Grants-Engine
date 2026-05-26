import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const apiKeyHeader = req.headers.get('x-api-key') || '';
  let token = '';

  if (apiKeyHeader) {
    token = apiKeyHeader;
  } else if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dbzbsqreymotzovhgodv.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
  
  if (token && supabaseServiceKey) {
    const keyHash = crypto.createHash('sha256').update(token).digest('hex');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: keyRecord, error } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_hash', keyHash)
      .single();

    if (!error && keyRecord) {
      // Asynchronously update last used time
      supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', keyHash).then();
      return { authenticated: true, userId: keyRecord.user_id };
    }
  }

  // Fallback to checking the active cookie session
  try {
    const { createClient: createServerClient } = await import('@/utils/supabase/server');
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (user) {
      return { authenticated: true, userId: user.id };
    }
  } catch (e) {
    console.error("Cookie session verification error:", e);
  }

  return { authenticated: false, userId: null };
}
