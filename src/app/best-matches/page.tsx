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

export default function BestMatchesPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ActiveProject | null>(null);
  const [activeOrg, setActiveOrg] = useState<string>('Project Cues, Inc.');

  useEffect(() => {
    async function loadProjects() {
      let currentOrg = 'Project Cues, Inc.';
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('organization_name')
          .eq('id', user.id)
          .single();
        if (profile?.organization_name) {
          currentOrg = profile.organization_name;
          setActiveOrg(currentOrg);
        }
      }

      const { data } = await supabase
        .from('active_projects')
        .select('*')
        .eq('project_type', 'grant')
        .order('deadline_date', { ascending: true });
      
      if (data) {
        // Filter for HIGH matches only (score >= 80% or level === 'High')
        const filtered = data.filter(p => {
          const match = getWinnabilityScore(currentOrg, p.title, p.description);
          return match.level === 'High';
        });
        setProjects(filtered);
      }
      setLoading(false);
    }
    loadProjects();
  }, [supabase]);

  const formatCurrency = (amount: any) => {
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getWinnabilityScore = (org: string, title: string, desc: string = '') => {
    const text = (title + ' ' + desc).toLowerCase();
    if (org.includes('Project Cues')) {
      if (text.includes('clinical trial') || text.includes('research training') || text.includes('saipan shower') || text.includes('insurance') || text.includes('janitorial') || text.includes('propulsion motor') || text.includes('valve') || text.includes('hose') || text.includes('tubing')) {
        if (text.includes('data coordinating') || text.includes('ctsa') || text.includes('integrative interventions') || text.includes('mhealth') || text.includes('remotely')) {
          return { score: 92, level: 'High', reason: 'Opportunity requires custom software platforms, remote mHealth channels, database management, or clinical data coordinating hubs. Aligns with Project Cues\' Next.js, Supabase, TypeScript, and AI systems capabilities.' };
        }
        return { score: 45, level: 'Low', reason: 'Focus is clinical, operational, or mechanical, which is outside Project Cues\' core software and AI specialties.' };
      }
      if (text.includes('communicati') || text.includes('circuit card') || text.includes('adapter')) {
        return { score: 75, level: 'Medium', reason: 'Involves technical communications, firmware, or adapters. Aligns with Project Cues\' systems integrations experience.' };
      }
      return { score: 60, level: 'Medium', reason: 'General opportunity. Project Cues can develop custom software portals or support platforms to manage this.' };
    } 
    
    if (org.includes('Promo Cues')) {
      if (text.includes('advertising') || text.includes('dissemination') || text.includes('implementation research') || text.includes('youth enjoy science') || text.includes('communication') || text.includes('education')) {
        return { score: 91, level: 'High', reason: 'Focuses on public outreach, program recruitment, science communication, or campaign dissemination. Aligns with Promo Cues\' whitelabeled VBOUT marketing automation reseller license.' };
      }
      if (text.includes('clinical trial') || text.includes('saipan shower') || text.includes('janitorial') || text.includes('valve') || text.includes('propulsion motor') || text.includes('hose')) {
        return { score: 35, level: 'Low', reason: 'Focus is strictly clinical or heavy industrial, which is outside Promo Cues\' digital marketing and advertising capabilities.' };
      }
      return { score: 58, level: 'Medium', reason: 'General outreach opportunity. Promo Cues can support targeted email marketing campaigns and branding.' };
    }
    
    if (org.includes('Package Cues')) {
      if (text.includes('drew') || text.includes('peralta') || text.includes('cargo') || text.includes('logistics') || text.includes('supply') || text.includes('dumpster') || text.includes('disposal') || text.includes('valve') || text.includes('hose') || text.includes('tubing') || text.includes('gland') || text.includes('adapter') || text.includes('propulsion motor')) {
        return { score: 88, level: 'High', reason: 'Focuses on supply chains, logistics, parts supply, cargo transport, or disposal scheduling. Aligns with Package Cues\' logistics tracking platforms and inventory databases.' };
      }
      if (text.includes('clinical trial') || text.includes('predoctoral') || text.includes('fellow') || text.includes('physician scientist')) {
        return { score: 30, level: 'Low', reason: 'Focus is clinical research training, unrelated to Package Cues\' logistics and transportation specialties.' };
      }
      return { score: 62, level: 'Medium', reason: 'Operational logistics opportunity. Package Cues can coordinate transport routing and delivery verifications.' };
    }
    return { score: 50, level: 'Medium', reason: 'General opportunity. Review requirements for company-specific alignment.' };
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-light text-white mb-2">Best Grant Matches</h2>
            <p className="text-slate-400">Browse grant solicitations highly aligned with your company's core capabilities.</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 max-w-max">
            <span className="text-slate-500">Best matches for:</span>
            <span className="text-emerald-400 font-semibold">{activeOrg}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects && projects.length > 0 ? (
            projects.map(p => {
              const match = getWinnabilityScore(activeOrg, p.title, p.description);
              return (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedProject(p)}
                  className="p-6 bg-slate-950/60 border border-emerald-500/20 rounded-lg hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-medium text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {match.score}% Match
                      </span>
                    </div>
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
              );
            })
          ) : (
            <p className="text-slate-500 col-span-2">No highly-matched grant opportunities found for this organization.</p>
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

              {/* Winnability Match Rating */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Winnability Fit ({activeOrg})</span>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {getWinnabilityScore(activeOrg, selectedProject.title, selectedProject.description).score}% High Match
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {getWinnabilityScore(activeOrg, selectedProject.title, selectedProject.description).reason}
                </p>
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
