'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/client';
import { Loader2, X, ExternalLink, Sparkles, Award, Calendar, Filter, Search, MapPin, Hash, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Parse YYYY-MM-DD as local date (avoids UTC timezone shift that causes off-by-one day)
const formatDeadlineDate = (dateStr: string | null) => {
  if (!dateStr) return 'TBD';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
};

interface ActiveProject {
  id: string;
  title: string;
  agency: string;
  deadline_date: string;
  amount: number;
  url?: string;
  description?: string;
  naics_code?: string;
  classification_code?: string;
  set_aside_type?: string;
  solicitation_number?: string;
  base_type?: string;
  place_of_performance?: string;
}

interface ScoreResult {
  id: string;
  score: number;
  level: string;
  reason: string;
  factors: string[];
}

export default function BestMatchesPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreResult>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ActiveProject | null>(null);
  const [activeOrg, setActiveOrg] = useState<string>('Project Cues, Inc.');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSetAside, setFilterSetAside] = useState<string>('all');
  const [filterNaics, setFilterNaics] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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
        setProjects(data);
        
        // Fetch AI-powered scores from API
        try {
          const res = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orgName: currentOrg, projects: data })
          });
          const scoreData = await res.json();
          if (scoreData.scores) {
            const scoreMap: Record<string, ScoreResult> = {};
            scoreData.scores.forEach((s: ScoreResult) => { scoreMap[s.id] = s; });
            setScores(scoreMap);
          }
        } catch (err) {
          console.error('Failed to fetch scores:', err);
        }
      }
      setLoading(false);
    }
    loadProjects();
  }, [supabase]);

  const formatCurrency = (amount: any, showZeroAsTbd = true) => {
    if (amount === null || amount === undefined || (showZeroAsTbd && amount === 0)) {
      return 'Budget TBD';
    }
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Get unique values for filter dropdowns
  const uniqueSetAsides = useMemo(() => {
    const types = projects.map(p => p.set_aside_type).filter(Boolean) as string[];
    return [...new Set(types)];
  }, [projects]);
  
  const uniqueNaics = useMemo(() => {
    const codes = projects.map(p => p.naics_code).filter(Boolean) as string[];
    return [...new Set(codes)].sort();
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(p => {
      const score = scores[p.id];
      if (!score || score.level !== 'High') return false; // Only show high matches
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && 
            !p.agency.toLowerCase().includes(q) &&
            !(p.solicitation_number || '').toLowerCase().includes(q) &&
            !(p.description || '').toLowerCase().includes(q)) return false;
      }
      if (filterSetAside !== 'all' && p.set_aside_type !== filterSetAside) return false;
      if (filterNaics !== 'all' && p.naics_code !== filterNaics) return false;
      return true;
    });
    
    // Sort by score descending
    filtered.sort((a, b) => (scores[b.id]?.score || 0) - (scores[a.id]?.score || 0));
    return filtered;
  }, [projects, scores, searchQuery, filterSetAside, filterNaics]);

  const getScoreColor = (level: string) => {
    switch(level) {
      case 'High': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
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
            <p className="text-slate-400">Browse grant opportunities and grants highly aligned with your company's core capabilities.</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2 max-w-max">
            <span className="text-slate-500">Best matches for:</span>
            <span className="text-cyan-400 font-semibold">{activeOrg}</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by title, agency, solicitation number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 border rounded-lg text-sm flex items-center gap-2 transition-all ${showFilters ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterSetAside}
                onChange={e => setFilterSetAside(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              >
                <option value="all">All Set-Asides</option>
                {uniqueSetAsides.map(sa => (
                  <option key={sa} value={sa}>{sa.substring(0, 50)}</option>
                ))}
              </select>
              <select
                value={filterNaics}
                onChange={e => setFilterNaics(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              >
                <option value="all">All NAICS Codes</option>
                {uniqueNaics.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map(p => {
              const match = scores[p.id] || { score: 50, level: 'Medium', reason: '', factors: [] };
              return (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedProject(p)}
                  className="p-6 bg-slate-950/60 border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-medium text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 border ${getScoreColor(match.level)}`}>
                        {match.score}% Match
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-1">{p.agency}</p>
                    
                    {/* Metadata badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
                      {p.naics_code && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-slate-800/50 text-slate-400 rounded">
                          <Hash className="w-2.5 h-2.5" />NAICS: {p.naics_code}
                        </span>
                      )}
                      {p.set_aside_type && p.set_aside_type !== 'No Set aside used' && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                          <Shield className="w-2.5 h-2.5" />SB Set-Aside
                        </span>
                      )}
                      {p.solicitation_number && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-slate-800/50 text-slate-400 rounded font-mono">
                          {p.solicitation_number}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-900 pt-4 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span>Deadline: {formatDeadlineDate(p.deadline_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-400 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-full">
                      <Award className="w-3.5 h-3.5" />
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-slate-500 col-span-2">No highly-matched grant opportunities found{searchQuery ? ` for "${searchQuery}"` : ''} for this organization.</p>
          )}
        </div>
      </div>

      {selectedProject && (() => {
        const match = scores[selectedProject.id] || { score: 50, level: 'Medium', reason: 'Scoring unavailable', factors: [] };
        return (
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
                  <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Grant Amount</span>
                  <span className="text-lg font-semibold text-cyan-400">
                    {selectedProject.amount ? formatCurrency(selectedProject.amount) : 'Funding TBD'}
                  </span>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Deadline Date</span>
                  <span className="text-lg font-semibold text-white">
                    {formatDeadlineDate(selectedProject.deadline_date)}
                  </span>
                </div>
              </div>

              {/* Grant Metadata */}
              <div className="grid grid-cols-2 gap-4">
                {selectedProject.solicitation_number && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Solicitation #</span>
                    <span className="text-sm font-mono text-slate-200">{selectedProject.solicitation_number}</span>
                  </div>
                )}
                {selectedProject.naics_code && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">NAICS Code</span>
                    <span className="text-sm font-mono text-slate-200">{selectedProject.naics_code}</span>
                  </div>
                )}
                {selectedProject.set_aside_type && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg col-span-2">
                    <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Set-Aside Type</span>
                    <span className="text-sm text-emerald-400">{selectedProject.set_aside_type}</span>
                  </div>
                )}
                {selectedProject.place_of_performance && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg col-span-2">
                    <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Place of Performance</span>
                    <span className="text-sm text-slate-200 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" />{selectedProject.place_of_performance}</span>
                  </div>
                )}
              </div>

              {/* Winnability Match Rating */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Winnability Fit ({activeOrg})</span>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getScoreColor(match.level)}`}>
                    {match.score}% {match.level} Match
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {match.reason}
                </p>
                {match.factors && match.factors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {match.factors.map((f, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span className="text-cyan-500 mt-0.5">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedProject.url && (
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Source Opportunity</span>
                  <a 
                    href={selectedProject.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-400 hover:underline inline-flex items-center gap-1.5 font-mono text-sm break-all"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Draft Grant Proposal
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </DashboardShell>
  );
}
