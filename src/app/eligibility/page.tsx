import { DashboardShell } from '@/components/layout/DashboardShell';

export default function EligibilityPage() {
  return (
    <DashboardShell>
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8">
        <h2 className="text-2xl font-light text-white mb-6">Eligibility Checker</h2>
        <p className="text-slate-400 mb-6">Determine your organization's eligibility for specific grants based on your verified profile.</p>
        
        <div className="p-6 bg-slate-950 border border-emerald-500/30 rounded-lg flex items-center justify-between">
          <div>
            <h3 className="text-emerald-400 font-medium mb-1">Status: Verified 501(c)(3)</h3>
            <p className="text-sm text-slate-400">Your organization meets standard federal requirements.</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Active
            </span>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
