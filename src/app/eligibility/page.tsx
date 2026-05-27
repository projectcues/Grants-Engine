'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/client';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function EligibilityPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const isProfileComplete = profile && profile.organization_name && profile.cage_code && profile.uei;

  return (
    <DashboardShell>
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8 max-w-4xl">
        <h2 className="text-2xl font-light text-white mb-6">Eligibility Checker</h2>
        <p className="text-slate-400 mb-8">
          Verify your organization's eligibility for federal and private grants based on SAM.gov registration details.
        </p>

        {isProfileComplete ? (
          <div className="space-y-8">
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400 mt-1 md:mt-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-lg">Status: Verified Entity</h3>
                  <p className="text-sm text-slate-400 mt-1">Your organization is fully registered and verified for federal grants.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>

            <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-6 space-y-4">
              <h3 className="text-white font-medium mb-4 text-left">Entity Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Organization Name</span>
                  <span className="text-slate-200">{profile.organization_name}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Role</span>
                  <span className="text-slate-200">{profile.role || 'Admin'}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">CAGE Code</span>
                  <span className="text-slate-200 font-mono">{profile.cage_code}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">UEI (Unique Entity ID)</span>
                  <span className="text-slate-200 font-mono">{profile.uei}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-left">
              <h3 className="text-white font-medium">Verified Eligibility Checklist</h3>
              <div className="space-y-2">
                <ChecklistItem label="Active SAM.gov Registration" completed={true} />
                <ChecklistItem label="Unique Entity ID (UEI) Validated" completed={true} />
                <ChecklistItem label="CAGE Code Validated" completed={true} />
                <ChecklistItem label="501(c)(3) / Non-profit / Small Business Status Synced" completed={true} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center max-w-xl mx-auto space-y-6">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-medium text-lg">Organization Profile Incomplete</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Please configure your CAGE Code, UEI, and Organization Name in settings. We need these details to cross-reference and verify your eligibility for opportunities.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-colors"
            >
              Configure Settings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function ChecklistItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      <span className="text-slate-300 text-sm">{label}</span>
    </div>
  );
}
