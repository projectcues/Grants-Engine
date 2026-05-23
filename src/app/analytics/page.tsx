import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/server';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { count } = await supabase.from('generated_documents').select('*', { count: 'exact', head: true }).eq('user_id', user?.id || '');

  return (
    <DashboardShell>
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8">
        <h2 className="text-2xl font-light text-white mb-6">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg">
            <h3 className="text-sm text-slate-400 mb-2">Total Proposals Generated</h3>
            <p className="text-3xl text-emerald-400">{count || 0}</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
