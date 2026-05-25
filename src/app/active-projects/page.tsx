import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/server';

export default async function ActiveProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from('active_projects').select('*').eq('project_type', 'grant');

  return (
    <DashboardShell>
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8">
        <h2 className="text-2xl font-light text-white mb-6">Active Grants</h2>
        <div className="space-y-4">
          {projects && projects.length > 0 ? (
            projects.map(p => (
              <div key={p.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <h3 className="text-lg text-emerald-400">{p.title}</h3>
                <p className="text-sm text-slate-400">{p.agency} • Deadline: {new Date(p.deadline_date).toLocaleDateString()}</p>
                <p className="text-sm text-slate-300 mt-2 font-medium">${p.amount.toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">No active projects found.</p>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
