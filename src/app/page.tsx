'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { FileText, Target, Award, Search, Sparkles, X, ExternalLink, Copy, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

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
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSnippet, setGeneratedSnippet] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ActiveProject | null>(null);
  const [activeOrg, setActiveOrg] = useState<string>('Project Cues, Inc.');
  const [copied, setCopied] = useState(false);
  const [discoveredSources, setDiscoveredSources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'draft' | 'checklist' | 'attachments'>('draft');

  const handleCopy = async () => {
    if (!generatedSnippet) return;
    try {
      await navigator.clipboard.writeText(generatedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };
  
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [proposalCount, setProposalCount] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const prefill = searchParams.get('prefill');
      if (prefill) {
        setUrl(prefill);
      }
    }
  }, []);

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

      // Fetch user's active company profile and generated count
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('organization_name')
          .eq('id', user.id)
          .single();
        if (profile?.organization_name) {
          setActiveOrg(profile.organization_name);
        }

        const { count } = await supabase
          .from('generated_documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setProposalCount(count || 0);

        // Fetch user's discovered sources
        const { data: sourcesData } = await supabase
          .from('discovered_sources')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (sourcesData) {
          setDiscoveredSources(sourcesData);
        }
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setGeneratedSnippet(data.proposal);
        // Also save to database locally for the user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('generated_documents').insert({
            user_id: user.id,
            source_url: url,
            document_type: 'grant',
            content: data.proposal
          });
          setProposalCount(prev => prev + 1);
          
          // Reload discovered sources
          const { data: sourcesData } = await supabase
            .from('discovered_sources')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
          if (sourcesData) {
            setDiscoveredSources(sourcesData);
          }
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

  const formatCurrency = (amount: any, showZeroAsTbd = true) => {
    if (amount === null || amount === undefined || (showZeroAsTbd && amount === 0)) {
      return 'Funding TBD';
    }
    const val = typeof amount === 'number' ? amount : Number(amount || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const calculateDaysLeft = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
    const deadline = new Date(y, m - 1, d);
    const diff = deadline.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
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

              {generatedSnippet && (() => {
                // Parse proposal markdown into three parts
                const getProposalSections = (snippet: string | null) => {
                  if (!snippet) return { draft: '', checklist: '', attachments: '' };
                  
                  const submissionIndex = snippet.indexOf('### 📤 Submission & Checklist Instructions');
                  const attachmentsIndex = snippet.indexOf('### 📎 Opportunity Attachments & Forms');

                  let draft = snippet;
                  let checklist = '';
                  let attachments = '';

                  if (submissionIndex !== -1 && attachmentsIndex !== -1) {
                    draft = snippet.substring(0, submissionIndex);
                    checklist = snippet.substring(submissionIndex, attachmentsIndex);
                    attachments = snippet.substring(attachmentsIndex);
                  } else if (submissionIndex !== -1) {
                    draft = snippet.substring(0, submissionIndex);
                    checklist = snippet.substring(submissionIndex);
                  } else if (attachmentsIndex !== -1) {
                    draft = snippet.substring(0, attachmentsIndex);
                    attachments = snippet.substring(attachmentsIndex);
                  }

                  return { 
                    draft: draft.trim(), 
                    checklist: checklist.trim(), 
                    attachments: attachments.trim() 
                  };
                };

                const sections = getProposalSections(generatedSnippet);

                return (
                  <div className="mt-8 p-6 bg-slate-950 border border-slate-800 rounded-lg relative group">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-4">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" /> 
                        Generated Opportunity Workspace
                      </h3>
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md text-xs text-slate-300 transition-colors"
                        title="Copy full workspace details"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-450" />
                            <span>Copy Workspace</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Tabs Selector */}
                    <div className="flex gap-2 mb-6 border-b border-slate-900 pb-3">
                      <button
                        onClick={() => setActiveTab('draft')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'draft'
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        Draft Proposal
                      </button>
                      <button
                        onClick={() => setActiveTab('checklist')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'checklist'
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        Submission Checklist
                      </button>
                      <button
                        onClick={() => setActiveTab('attachments')}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'attachments'
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200 border border-transparent'
                        }`}
                      >
                        Forms & Attachments
                      </button>
                    </div>

                    {/* Tab Contents */}
                    <div className="text-slate-350 text-sm leading-relaxed max-h-96 overflow-y-auto pr-2 select-text text-left">
                      {activeTab === 'draft' && (
                        <MarkdownRenderer content={sections.draft} />
                      )}
                      {activeTab === 'checklist' && (
                        <MarkdownRenderer content={sections.checklist || '### 📤 Submission Checklist\n\nNo specific submission guidelines found. Please refer to the official Opportunity details.'} />
                      )}
                      {activeTab === 'attachments' && (
                        <MarkdownRenderer content={sections.attachments || '### 📎 Downloadable Attachments & Forms\n\nNo attachment forms could be parsed. Refer to the opportunity details.'} />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            <StatCard icon={<FileText />} label="Your Proposals" value={proposalCount.toString()} />
            <StatCard icon={<Award />} label="Eligible Funds" value={formatCurrency(projects.reduce((acc, curr) => acc + (curr.amount || 0), 0), false)} />
          </div>
        </div>

        {/* Sidebar / Recent Activity */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Upcoming Deadlines</h3>
              <Link href="/active-projects" className="text-emerald-400 text-sm hover:text-emerald-300">View All</Link>
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
                    match={getWinnabilityScore(activeOrg, p.title, p.description)}
                    onClick={() => setSelectedProject(p)}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-sm">No active projects found.</p>
              )}
            </div>
          </div>

          {/* Discovered Opportunities & Sources */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Discovered Sources
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              These reference directories and solicitation pipelines were automatically harvested during previous runs.
            </p>
            
            <div className="space-y-3">
              {discoveredSources.length > 0 ? (
                discoveredSources.map((ds) => (
                  <div key={ds.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col gap-1.5 text-left">
                    <span className="text-sm font-medium text-slate-200 truncate" title={ds.name}>{ds.name}</span>
                    <a 
                      href={ds.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{ds.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs py-4 text-center">No discovered sources yet. Run the engine to harvest links.</p>
              )}
            </div>
          </div>
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
                    {formatDeadlineDate(selectedProject.deadline_date)}
                  </span>
                </div>
              </div>

              {/* Winnability Match Rating */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Winnability Fit ({activeOrg})</span>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    getWinnabilityScore(activeOrg, selectedProject.title, selectedProject.description).level === 'High' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    getWinnabilityScore(activeOrg, selectedProject.title, selectedProject.description).level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {getWinnabilityScore(activeOrg, selectedProject.title, selectedProject.description).score}% {getWinnabilityScore(activeOrg, selectedProject.title, selectedProject.description).level} Match
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
                  setUrl(selectedProject.url || '');
                  setSelectedProject(null);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Apply to AI Engine
              </button>
            </div>
          </div>
        </div>
      )}
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

function DeadlineItem({ title, agency, daysLeft, amount, match, onClick }: { title: string, agency: string, daysLeft: number, amount: string, match?: { score: number, level: string }, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-slate-200 font-medium group-hover:text-emerald-400 transition-colors">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{agency}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            daysLeft <= 7 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {daysLeft} Days
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm mt-3 border-t border-slate-900 pt-2">
        <div className="flex items-center gap-2 text-slate-400">
          <Award className="w-4 h-4" />
          <span>{amount}</span>
        </div>
        {match && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            match.level === 'High' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            match.level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
          }`}>
            Match: {match.score}% ({match.level})
          </span>
        )}
      </div>
    </div>
  );
}
