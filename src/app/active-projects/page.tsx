'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/client';
import { Loader2, X, ExternalLink, Sparkles, Award, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActiveProject {
  id: string;
  title: string;
  agency: string;
  deadline_date: string;
  amount: number;
  url?: string;
  description?: string;
}

export default function ActiveProjectsPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ActiveProject | null>(null);

  useEffect(() => {
    async function loadProjects() {
      const { data } = await supabase
        .from('active_projects')
        .select('*')
        .eq('project_type', 'grant')
        .order('deadline_date', { ascending: true });
      if (data) {
        setProjects(data);
      }
      setLoading(false);
    }
    loadProjects();
  }, [supabase]);

  const formatCurrency = (amount: any) => {
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8">
        <h2 className="text-2xl font-light text-white mb-2">Active Grants</h2>
        <p className="text-slate-400 mb-8">Browse current open grant solicitations. Click any opportunity to see details and apply.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects && projects.length > 0 ? (
            projects.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedProject(p)}
                className="p-6 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-medium text-slate-200 group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">{p.agency}</p>
                </div>
                
                <div className="border-t border-slate-900 pt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>Deadline: {new Date(p.deadline_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <Award className="w-3.5 h-3.5" />
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 col-span-2">No active projects found.</p>
          )}
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl relative overflow-hidden max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-medium text-white text-left">{selectedProject.title}</h3>
                <p className="text-sm text-slate-400 mt-1 text-left">{selectedProject.agency}</p>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Funding Amount</span>
                  <span className="text-lg font-semibold text-emerald-400">
                    {selectedProject.amount ? formatCurrency(selectedProject.amount) : 'Funding TBD'}
                  </span>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Deadline Date</span>
                  <span className="text-lg font-semibold text-white">
                    {new Date(selectedProject.deadline_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {selectedProject.url && (
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Source Opportunity</span>
                  <a 
                    href={selectedProject.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-emerald-400 hover:underline inline-flex items-center gap-1.5 font-mono text-sm break-all"
                  >
                    {selectedProject.url}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div>
                <span className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Solicitation Description</span>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedProject.description || 'No description provided.'}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  router.push('/?prefill=' + encodeURIComponent(selectedProject.url || ''));
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Draft AI Response
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
