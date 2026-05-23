import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/server';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <DashboardShell>
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8 max-w-2xl">
        <h2 className="text-2xl font-light text-white mb-6">Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <input type="text" disabled value={user?.email || ''} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Account Role</label>
            <input type="text" disabled value="Admin" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed" />
          </div>
          <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium rounded-lg">
            Save Changes
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
