'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/client';
import { Loader2, FileText, Calendar, ExternalLink, Eye, Copy, Check, X, Award } from 'lucide-react';

interface GeneratedDoc {
  id: string;
  source_url: string;
  content: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [proposals, setProposals] = useState<GeneratedDoc[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<GeneratedDoc | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch proposals
        const { data: docs } = await supabase
          .from('generated_documents')
          .select('*')
          .eq('user_id', user.id)
          .eq('document_type', 'grant')
          .order('created_at', { ascending: false });
        
        if (docs) setProposals(docs);

        // Fetch active projects count
        const { count } = await supabase
          .from('active_projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('project_type', 'grant');
        
        setActiveCount(count || 0);
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
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
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-light text-white mb-2">Analytics</h2>
          <p className="text-slate-400">Track proposal generations, pipeline metrics, and system efficiency.</p>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm text-slate-400 mb-1">Proposals Generated</h3>
              <p className="text-3xl font-semibold text-white tracking-tight">{proposals.length}</p>
            </div>
          </div>

          <div className="p-6 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm text-slate-400 mb-1">Active Grant Pipeline</h3>
              <p className="text-3xl font-semibold text-white tracking-tight">{activeCount}</p>
            </div>
          </div>
        </div>

        {/* Proposals History Table */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg text-white font-medium">Generation History</h3>
          </div>
          
          {proposals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-950/40">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Source Opportunity</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {proposals.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-md truncate">
                        <a 
                          href={doc.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1.5"
                        >
                          {doc.source_url}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 transition-colors"
                        >
                          <Eye className="w-4 h-4 text-emerald-400" />
                          View Proposal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No generated proposals found. Go to the dashboard to draft your first proposal!
            </div>
          )}
        </div>

        {/* Modal Overlay for Proposal Preview */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl flex flex-col shadow-2xl relative overflow-hidden max-h-[85vh]">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Proposal Draft Preview</h3>
                  <a 
                    href={selectedDoc.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 mt-1 font-mono"
                  >
                    {selectedDoc.source_url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto bg-slate-950 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono select-text flex-1">
                {selectedDoc.content}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                <button
                  onClick={() => handleCopy(selectedDoc.content)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Content
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
