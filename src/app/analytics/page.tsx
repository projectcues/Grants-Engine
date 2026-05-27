'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/client';
import { Loader2, TrendingUp, TrendingDown, Calendar, DollarSign, Target, Award, Clock, BarChart3, PieChart } from 'lucide-react';

const formatDeadlineDate = (dateStr: string | null) => {
  if (!dateStr) return 'TBD';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (amount: any) => {
  if (!amount || amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount));
};

interface Project {
  id: string;
  title: string;
  agency: string;
  deadline_date: string;
  amount: number | null;
  project_type: string;
  naics_code: string | null;
  set_aside_type: string | null;
  base_type: string | null;
  created_at: string;
}

interface PipelineEntry {
  id: string;
  status: string;
  win_amount: number | null;
  loss_reason: string | null;
  submitted_at: string | null;
  created_at: string;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipeline, setPipeline] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [projRes, pipeRes] = await Promise.all([
        supabase.from('active_projects').select('id, title, agency, deadline_date, amount, project_type, naics_code, set_aside_type, base_type, created_at'),
        supabase.from('bid_pipeline').select('id, status, win_amount, loss_reason, submitted_at, created_at'),
      ]);
      if (projRes.data) setProjects(projRes.data);
      if (pipeRes.data) setPipeline(pipeRes.data);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Summary Stats ──
  const contracts = useMemo(() => projects.filter(p => p.project_type === 'contract'), [projects]);
  const grants = useMemo(() => projects.filter(p => p.project_type === 'grant'), [projects]);
  const totalValue = useMemo(() => projects.reduce((s, p) => s + (p.amount || 0), 0), [projects]);
  
  const wonBids = pipeline.filter(p => p.status === 'awarded');
  const lostBids = pipeline.filter(p => p.status === 'lost');
  const activeBids = pipeline.filter(p => !['awarded', 'lost'].includes(p.status));
  const winRate = wonBids.length + lostBids.length > 0 ? Math.round((wonBids.length / (wonBids.length + lostBids.length)) * 100) : 0;
  const totalWon = wonBids.reduce((s, b) => s + (b.win_amount || 0), 0);
  const avgDealSize = wonBids.length > 0 ? totalWon / wonBids.length : 0;

  // ── Upcoming Deadlines (next 14 days) ──
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    const twoWeeks = new Date(today.getTime() + 14 * 86400000);
    return projects
      .filter(p => {
        if (!p.deadline_date) return false;
        const [y, m, d] = p.deadline_date.split('-').map(Number);
        const dd = new Date(y, m - 1, d);
        return dd >= today && dd <= twoWeeks;
      })
      .sort((a, b) => a.deadline_date.localeCompare(b.deadline_date))
      .slice(0, 8);
  }, [projects]);

  // ── NAICS Distribution ──
  const naicsDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    contracts.forEach(c => {
      const key = c.naics_code || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [contracts]);

  // ── Set-Aside Distribution ──
  const setAsideDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    contracts.forEach(c => {
      const key = c.set_aside_type || 'No Set-Aside';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [contracts]);

  // ── Agency Distribution ──
  const agencyDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      const key = p.agency?.split('/')[0]?.trim() || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [projects]);

  // ── Loss Reasons ──
  const lossReasons = useMemo(() => {
    const counts: Record<string, number> = {};
    lostBids.forEach(b => {
      const key = b.loss_reason || 'Not specified';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [lostBids]);

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
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Opportunities', value: projects.length, icon: <Target className="w-5 h-5 text-cyan-500" />, sub: `${contracts.length} contracts · ${grants.length} grants` },
          { label: 'Pipeline Value', value: formatCurrency(totalValue), icon: <DollarSign className="w-5 h-5 text-emerald-500" />, sub: `${activeBids.length} active bids` },
          { label: 'Win Rate', value: `${winRate}%`, icon: winRate >= 50 ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />, sub: `${wonBids.length} won · ${lostBids.length} lost` },
          { label: 'Total Won', value: formatCurrency(totalWon), icon: <Award className="w-5 h-5 text-amber-500" />, sub: avgDealSize > 0 ? `Avg: ${formatCurrency(avgDealSize)}` : 'No wins yet' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
              {stat.icon}
            </div>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-slate-600 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-medium text-white">Upcoming Deadlines</h3>
            <span className="text-xs text-slate-600 ml-auto">Next 14 days</span>
          </div>
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-3">
              {upcomingDeadlines.map(p => {
                const [y, m, d] = p.deadline_date.split('-').map(Number);
                const dd = new Date(y, m - 1, d);
                const today = new Date();
                today.setHours(0,0,0,0);
                const daysLeft = Math.ceil((dd.getTime() - today.getTime()) / 86400000);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-800/50 rounded-lg">
                    <div className={`text-center px-2.5 py-1 rounded ${daysLeft <= 3 ? 'bg-red-500/10 text-red-400' : daysLeft <= 7 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                      <p className="text-lg font-bold leading-none">{daysLeft}</p>
                      <p className="text-[9px] uppercase">days</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{p.title}</p>
                      <p className="text-[11px] text-slate-500">{p.agency?.substring(0, 40)}</p>
                    </div>
                    <p className="text-xs text-slate-500 shrink-0">{formatDeadlineDate(p.deadline_date)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center py-8">No deadlines in the next 14 days</p>
          )}
        </div>

        {/* NAICS Distribution */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-medium text-white">NAICS Code Distribution</h3>
          </div>
          <div className="space-y-2.5">
            {naicsDistribution.map(([code, count]) => {
              const pct = Math.round((count / contracts.length) * 100);
              return (
                <div key={code} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 w-16 shrink-0">{code}</span>
                  <div className="flex-1 bg-slate-950 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500/30 to-cyan-500/10 rounded-full flex items-center pl-2" style={{ width: `${Math.max(pct, 8)}%` }}>
                      <span className="text-[10px] text-cyan-400 font-medium">{count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Set-Aside Breakdown */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-medium text-white">Set-Aside Types</h3>
          </div>
          <div className="space-y-2.5">
            {setAsideDistribution.map(([type, count]) => {
              const pct = Math.round((count / contracts.length) * 100);
              const isSmallBiz = type.toLowerCase().includes('small business');
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs truncate ${isSmallBiz ? 'text-emerald-400' : 'text-slate-400'}`}>{type.substring(0, 45)}</span>
                      <span className="text-[10px] text-slate-600 shrink-0 ml-2">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5">
                      <div className={`h-full rounded-full ${isSmallBiz ? 'bg-emerald-500/50' : 'bg-purple-500/30'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Agencies */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-medium text-white">Top Agencies</h3>
          </div>
          <div className="space-y-3">
            {agencyDistribution.map(([agency, count], i) => (
              <div key={agency} className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-800/50 rounded-lg">
                <span className="text-lg font-bold text-slate-700 w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{agency}</p>
                </div>
                <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-medium">{count} opps</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loss Analysis */}
      {lossReasons.length > 0 && (
        <div className="mt-6 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-medium text-white">Loss Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lossReasons.map(([reason, count]) => (
              <div key={reason} className="p-4 bg-red-950/20 border border-red-500/10 rounded-lg">
                <p className="text-sm text-slate-300">{reason}</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
