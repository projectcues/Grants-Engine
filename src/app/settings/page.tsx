'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/client';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [cageCode, setCageCode] = useState('');
  const [uei, setUei] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || '');
          setOrgName(profile.organization_name || '');
          setCageCode(profile.cage_code || '');
          setUei(profile.uei || '');
        } else {
          setFullName(user.user_metadata?.full_name || '');
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          organization_name: orgName,
          cage_code: cageCode,
          uei: uei,
          role: 'Admin'
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
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
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8 max-w-2xl">
        <h2 className="text-2xl font-light text-white mb-6">Settings</h2>
        
        {message && (
          <div className={`p-4 mb-6 rounded-lg border flex items-center gap-3 text-sm text-left ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <input type="text" disabled value={email} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Account Role</label>
            <input type="text" disabled value="Admin" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Organization Name</label>
            <input 
              type="text" 
              value={orgName} 
              onChange={(e) => setOrgName(e.target.value)} 
              placeholder="e.g. Acme Corporation"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">CAGE Code</label>
              <input 
                type="text" 
                value={cageCode} 
                onChange={(e) => setCageCode(e.target.value.toUpperCase())} 
                placeholder="e.g. 1AB23"
                maxLength={5}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">UEI (Unique Entity ID)</label>
              <input 
                type="text" 
                value={uei} 
                onChange={(e) => setUei(e.target.value.toUpperCase())} 
                placeholder="e.g. AB12CD34EF56"
                maxLength={12}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}
