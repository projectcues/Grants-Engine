'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { FileText, Target, Award, Search, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ActiveProject {
  id: string;
  title: string;
  agency: string;
  deadline_date: string;
  amount: number;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSnippet, setGeneratedSnippet] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [proposalCount, setProposalCount] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Fetch real active projects
      const { data: projectsData } = await supabase
        .from('active_projects')
        .select('*')
        .eq('status', 'active')
        .eq('project_type', 'grant')
        .order('deadline_date', { ascending: true })
        .limit(3);
      
      if (projectsData) {
        setProjects(projectsData);
      }

      // Fetch user's actual generated documents count
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from('generated_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setProposalCount(count || 0);
      }
    }
    fetchData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsProcessing(true);
    setGeneratedSnippet(null);
    
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantUrl: url })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setGeneratedSnippet(data.proposalSnippet);
        // Also save to database locally for the user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('generated_documents').insert({
            user_id: user.id,
            source_url: url,
            document_type: 'grant',
            content: data.proposalSnippet // in reality we'd store the full proposal
          });
          setProposalCount(prev => prev + 1);
        }
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Failed to generate: " + err.message);
    } finally {
      setIsProcessing(false);
      setUrl('');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const calculateDaysLeft = (dateString: string) => {
    const diff = new Date(dateString).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
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

              {generatedSnippet && (
                <div className="mt-8 p-6 bg-slate-950 border border-emerald-500/30 rounded-lg">
                  <h3 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> 
                    Generation Complete
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{generatedSnippet}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            <StatCard icon={<FileText />} label="Your Proposals" value={proposalCount.toString()} />
            {/* Compute dynamic total from DB projects for demo purposes, or keep standard value */}
            <StatCard icon={<Award />} label="Eligible Funds" value={formatCurrency(projects.reduce((acc, curr) => acc + curr.amount, 0))} />
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
              {projects.length > 0 ? (
                projects.map((p) => (
                  <DeadlineItem 
                    key={p.id}
                    title={p.title} 
                    agency={p.agency}
                    daysLeft={calculateDaysLeft(p.deadline_date)}
                    amount={formatCurrency(p.amount)}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm">No active projects found.</p>
              )}
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
