'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Plus, X, ChevronRight, Calendar, DollarSign, Building2, Clock, Trophy, XCircle, FileText, ExternalLink } from 'lucide-react';

const formatDeadlineDate = (dateStr: string | null) => {
  if (!dateStr) return 'TBD';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const STAGES = [
  { key: 'identified', label: 'Identified', icon: <FileText className="w-3.5 h-3.5" />, color: 'slate' },
  { key: 'qualifying', label: 'Qualifying', icon: <Clock className="w-3.5 h-3.5" />, color: 'blue' },
  { key: 'drafting', label: 'Drafting', icon: <FileText className="w-3.5 h-3.5" />, color: 'amber' },
  { key: 'reviewing', label: 'Reviewing', icon: <ChevronRight className="w-3.5 h-3.5" />, color: 'purple' },
  { key: 'submitted', label: 'Submitted', icon: <ChevronRight className="w-3.5 h-3.5" />, color: 'cyan' },
  { key: 'awarded', label: 'Awarded', icon: <Trophy className="w-3.5 h-3.5" />, color: 'emerald' },
  { key: 'lost', label: 'Lost', icon: <XCircle className="w-3.5 h-3.5" />, color: 'red' },
];

const STAGE_COLORS: Record<string, string> = {
  slate: 'border-slate-700 bg-slate-900/40',
  blue: 'border-blue-500/30 bg-blue-950/30',
  amber: 'border-amber-500/30 bg-amber-950/30',
  purple: 'border-purple-500/30 bg-purple-950/30',
  cyan: 'border-cyan-500/30 bg-cyan-950/30',
  emerald: 'border-emerald-500/30 bg-emerald-950/30',
  red: 'border-red-500/30 bg-red-950/30',
};

const STAGE_DOT: Record<string, string> = {
  slate: 'bg-slate-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
};

interface PipelineItem {
  id: string;
  status: string;
  notes: string | null;
  win_amount: number | null;
  loss_reason: string | null;
  submitted_at: string | null;
  created_at: string;
  project: {
    id: string;
    title: string;
    agency: string;
    deadline_date: string;
    amount: number | null;
    url: string | null;
    solicitation_number: string | null;
    naics_code: string | null;
    set_aside_type: string | null;
  };
}

interface AvailableProject {
  id: string;
  title: string;
  agency: string;
  deadline_date: string;
  amount: number | null;
  solicitation_number: string | null;
}

export default function PipelinePage() {
  const supabase = createClient();
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([]);
  const [selectedForAdd, setSelectedForAdd] = useState<string | null>(null);
  const [addNotes, setAddNotes] = useState('');
  const [actionItem, setActionItem] = useState<PipelineItem | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLossReason, setActionLossReason] = useState('');
  const [actionWinAmount, setActionWinAmount] = useState('');

  const loadPipeline = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('bid_pipeline')
      .select(`
        id, status, notes, win_amount, loss_reason, submitted_at, created_at,
        project:active_projects(id, title, agency, deadline_date, amount, url, solicitation_number, naics_code, set_aside_type)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setItems(data as any);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadPipeline(); }, [loadPipeline]);

  const openAddModal = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get IDs already in pipeline
    const existingIds = items.map(i => i.project?.id).filter(Boolean);

    const { data: projects } = await supabase
      .from('active_projects')
      .select('id, title, agency, deadline_date, amount, solicitation_number')
      .eq('project_type', 'contract')
      .order('deadline_date', { ascending: true });

    if (projects) {
      setAvailableProjects(projects.filter(p => !existingIds.includes(p.id)));
    }
    setShowAddModal(true);
  };

  const addToPipeline = async () => {
    if (!selectedForAdd) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('bid_pipeline').insert({
      user_id: user.id,
      project_id: selectedForAdd,
      status: 'identified',
      notes: addNotes || null,
    });

    setShowAddModal(false);
    setSelectedForAdd(null);
    setAddNotes('');
    loadPipeline();
  };

  const moveToStage = async (itemId: string, newStatus: string) => {
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'submitted') updates.submitted_at = new Date().toISOString();
    
    await supabase.from('bid_pipeline').update(updates).eq('id', itemId);
    loadPipeline();
  };

  const recordOutcome = async () => {
    if (!actionItem) return;
    const updates: any = {
      notes: actionNotes || actionItem.notes,
      updated_at: new Date().toISOString(),
    };

    if (actionItem.status === 'awarded' || actionWinAmount) {
      updates.status = 'awarded';
      updates.win_amount = parseFloat(actionWinAmount) || null;
    } else if (actionLossReason) {
      updates.status = 'lost';
      updates.loss_reason = actionLossReason;
    }

    await supabase.from('bid_pipeline').update(updates).eq('id', actionItem.id);
    setActionItem(null);
    setActionNotes('');
    setActionLossReason('');
    setActionWinAmount('');
    loadPipeline();
  };

  const removeFromPipeline = async (id: string) => {
    await supabase.from('bid_pipeline').delete().eq('id', id);
    loadPipeline();
  };

  const formatCurrency = (amount: any) => {
    if (!amount) return 'TBD';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount));
  };

  // Group items by stage
  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage.key] = items.filter(i => i.status === stage.key);
    return acc;
  }, {} as Record<string, PipelineItem[]>);

  // Summary stats
  const totalPipeline = items.filter(i => !['awarded', 'lost'].includes(i.status)).length;
  const totalValue = items
    .filter(i => !['awarded', 'lost'].includes(i.status))
    .reduce((sum, i) => sum + (i.project?.amount || 0), 0);
  const wonCount = items.filter(i => i.status === 'awarded').length;
  const lostCount = items.filter(i => i.status === 'lost').length;
  const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

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
      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Pipeline', value: totalPipeline, sub: 'opportunities' },
          { label: 'Pipeline Value', value: formatCurrency(totalValue), sub: 'total potential' },
          { label: 'Win Rate', value: `${winRate}%`, sub: `${wonCount}W / ${lostCount}L` },
          { label: 'Submitted', value: grouped['submitted']?.length || 0, sub: 'awaiting decision' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-slate-600 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Board */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-light text-white">Bid Pipeline</h2>
            <p className="text-slate-400 text-sm mt-1">Track opportunities from identification through award or loss.</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Opportunity
          </button>
        </div>

        {/* Kanban Columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageItems = grouped[stage.key] || [];
            return (
              <div key={stage.key} className={`flex-shrink-0 w-72 rounded-xl border p-4 ${STAGE_COLORS[stage.color]}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${STAGE_DOT[stage.color]}`} />
                  <h3 className="text-sm font-medium text-slate-300">{stage.label}</h3>
                  <span className="ml-auto text-xs text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-full">{stageItems.length}</span>
                </div>

                <div className="space-y-3 min-h-[100px]">
                  {stageItems.map(item => {
                    const p = item.project;
                    if (!p) return null;
                    const currentIdx = STAGES.findIndex(s => s.key === item.status);
                    const nextStage = STAGES[currentIdx + 1];
                    
                    return (
                      <div key={item.id} className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-3.5 group hover:border-slate-700 transition-all">
                        <h4 className="text-sm font-medium text-slate-200 line-clamp-2 mb-1.5">{p.title}</h4>
                        <p className="text-[11px] text-slate-500 mb-2 line-clamp-1">{p.agency}</p>
                        
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-3">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDeadlineDate(p.deadline_date)}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(p.amount)}</span>
                        </div>

                        {p.solicitation_number && (
                          <p className="text-[10px] font-mono text-slate-600 mb-2 truncate">{p.solicitation_number}</p>
                        )}

                        {item.notes && (
                          <p className="text-[10px] text-slate-500 italic mb-2 line-clamp-2">&ldquo;{item.notes}&rdquo;</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {nextStage && !['awarded', 'lost'].includes(item.status) && (
                            <button
                              onClick={() => moveToStage(item.id, nextStage.key)}
                              className="text-[10px] px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded hover:bg-cyan-500/20 transition-all flex items-center gap-1"
                            >
                              <ChevronRight className="w-3 h-3" />
                              {nextStage.label}
                            </button>
                          )}
                          {item.status === 'submitted' && (
                            <>
                              <button
                                onClick={() => { setActionItem(item); setActionWinAmount(String(item.project?.amount || '')); }}
                                className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20"
                              >
                                Won
                              </button>
                              <button
                                onClick={() => { setActionItem(item); setActionLossReason(''); }}
                                className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
                              >
                                Lost
                              </button>
                            </>
                          )}
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] px-2 py-1 bg-slate-800/50 text-slate-400 rounded hover:text-white"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => removeFromPipeline(item.id)}
                            className="text-[10px] px-1.5 py-1 text-slate-600 hover:text-red-400 ml-auto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {stageItems.length === 0 && (
                    <p className="text-xs text-slate-700 text-center py-8">No items</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add to Pipeline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Add to Pipeline</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {availableProjects.length > 0 ? (
                availableProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedForAdd(p.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedForAdd === p.id ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}
                  >
                    <h4 className="text-sm font-medium text-slate-200 line-clamp-1">{p.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{p.agency}</p>
                    <div className="flex gap-3 mt-2 text-[10px] text-slate-600">
                      <span>Deadline: {formatDeadlineDate(p.deadline_date)}</span>
                      <span>{formatCurrency(p.amount)}</span>
                      {p.solicitation_number && <span className="font-mono">{p.solicitation_number}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">All active contracts are already in your pipeline.</p>
              )}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
                <textarea
                  value={addNotes}
                  onChange={e => setAddNotes(e.target.value)}
                  placeholder="Why are you tracking this opportunity?"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button
                onClick={addToPipeline}
                disabled={!selectedForAdd}
                className="px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outcome Recording Modal */}
      {actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-medium text-white">Record Outcome</h3>
              <p className="text-sm text-slate-400 mt-1">{actionItem.project?.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Win Amount</label>
                <input
                  type="number"
                  value={actionWinAmount}
                  onChange={e => setActionWinAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Loss Reason (if lost)</label>
                <input
                  type="text"
                  value={actionLossReason}
                  onChange={e => setActionLossReason(e.target.value)}
                  placeholder="e.g. Price too high, lacked past performance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="Debrief notes..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button onClick={() => setActionItem(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button onClick={recordOutcome} className="px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg">
                Save Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
