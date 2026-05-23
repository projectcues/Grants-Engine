'use client';

import { useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { FileText, Target, Award, Search, Sparkles } from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsProcessing(true);
    // TODO: Implement actual scraping & generation API call
    setTimeout(() => {
      setIsProcessing(false);
      setUrl('');
    }, 2000);
  };

  return (
    <DashboardShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main AI Generation Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="w-48 h-48 text-emerald-500" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-light text-white mb-2">Automated Grant Generation</h2>
              <p className="text-slate-400 mb-8 max-w-xl">
                Paste a link to a grant opportunity (e.g., from Grants.gov or a foundation). The AI will scrape the requirements and generate a highly-tailored proposal using your past successful drafts.
              </p>
              
              <form onSubmit={handleSubmit} className="flex gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://grants.gov/search-results-detail/..."
                    className="block w-full pl-11 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !url}
                  className="px-8 py-4 bg-emerald-500 text-slate-950 font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Draft Proposal
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            <StatCard icon={<FileText />} label="Active Proposals" value="12" />
            <StatCard icon={<Award />} label="Funds Secured" value="$4.2M" />
          </div>
        </div>

        {/* Sidebar / Recent Activity */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Upcoming Deadlines</h3>
              <button className="text-emerald-400 text-sm hover:text-emerald-300">View All</button>
            </div>
            
            <div className="space-y-4">
              <DeadlineItem 
                title="NSF AI Research Grant" 
                agency="National Science Foundation"
                daysLeft={5}
                amount="$500,000"
              />
              <DeadlineItem 
                title="Community Tech Fund" 
                agency="Project Cues Foundation"
                daysLeft={12}
                amount="$150,000"
              />
              <DeadlineItem 
                title="DoE Clean Energy Innovator" 
                agency="Dept. of Energy"
                daysLeft={28}
                amount="$1.2M"
              />
            </div>
          </div>
        </div>
        
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 flex items-start gap-4">
      <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
        {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-6 h-6' })}
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function DeadlineItem({ title, agency, daysLeft, amount }: { title: string, agency: string, daysLeft: number, amount: string }) {
  return (
    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-slate-200 font-medium group-hover:text-emerald-400 transition-colors">{title}</h4>
          <p className="text-xs text-slate-500">{agency}</p>
        </div>
        <div className="text-right">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            daysLeft <= 7 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {daysLeft} Days
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-400 mt-3">
        <Award className="w-4 h-4" />
        <span>{amount}</span>
      </div>
    </div>
  );
}
