'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createClient } from '@/utils/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Trash2, Key, Copy, Check } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  
  // Profile settings state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [cageCode, setCageCode] = useState('');
  const [uei, setUei] = useState('');
  const [naicsCodes, setNaicsCodes] = useState('');
  const [duns, setDuns] = useState('');
  const [samStatus, setSamStatus] = useState('unknown');
  const [capabilitiesStatement, setCapabilitiesStatement] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [keyName, setKeyName] = useState('');
  const [newKeyToken, setNewKeyToken] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  async function loadApiKeys() {
    try {
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setApiKeys(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKeys(false);
    }
  }

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
          setNaicsCodes((profile.naics_codes || []).join(', '));
          setDuns(profile.duns || '');
          setSamStatus(profile.sam_registration_status || 'unknown');
          setCapabilitiesStatement(profile.capabilities_statement || '');
        } else {
          setFullName(user.user_metadata?.full_name || '');
        }
        await loadApiKeys();
      }
      setLoading(false);
    }
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          naics_codes: naicsCodes.split(',').map(s => s.trim()).filter(Boolean),
          duns: duns || null,
          sam_registration_status: samStatus,
          capabilities_statement: capabilitiesStatement || null,
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

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    setNewKeyToken(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate plaintext token with pc_c_ prefix for Contracts
      const array = new Uint8Array(24);
      window.crypto.getRandomValues(array);
      const token = 'pc_c_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

      // Hash token using SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Save to Supabase
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: keyName,
          key_hash: hashHex,
          prefix: token.substring(0, 8)
        });

      if (error) throw error;

      setNewKeyToken(token);
      setKeyName('');
      await loadApiKeys();
    } catch (err: any) {
      alert("Failed to generate API Key: " + err.message);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API Key? Any agent using this key will lose access immediately.')) return;
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await loadApiKeys();
    } catch (err: any) {
      alert("Failed to delete key: " + err.message);
    }
  };

  const handleCopyKey = async () => {
    if (!newKeyToken) return;
    try {
      await navigator.clipboard.writeText(newKeyToken);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (e) {
      console.error(e);
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Profile Settings */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8">
          <h2 className="text-2xl font-light text-white mb-6 text-left">Settings</h2>
          
          {message && (
            <div className={`p-4 mb-6 rounded-lg border flex items-center gap-3 text-sm text-left ${
              message.type === 'success' 
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-left">Email Address</label>
              <input type="text" disabled value={email} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed text-left font-mono" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-left">Account Role</label>
              <input type="text" disabled value="Admin" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed text-left" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-left">Full Name</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-left" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 text-left">Organization Name</label>
              <input 
                type="text" 
                value={orgName} 
                onChange={(e) => setOrgName(e.target.value)} 
                placeholder="e.g. Acme Corporation"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-left" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 text-left">CAGE Code</label>
                <input 
                  type="text" 
                  value={cageCode} 
                  onChange={(e) => setCageCode(e.target.value.toUpperCase())} 
                  placeholder="e.g. 1AB23"
                  maxLength={5}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-left" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 text-left">UEI (Unique Entity ID)</label>
                <input 
                  type="text" 
                  value={uei} 
                  onChange={(e) => setUei(e.target.value.toUpperCase())} 
                  placeholder="e.g. AB12CD34EF56"
                  maxLength={12}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-left font-mono" 
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 mt-6">
              <h3 className="text-lg font-medium text-slate-200 mb-4 text-left">Government Contracting Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1 text-left">NAICS Codes (comma-separated)</label>
                  <input 
                    type="text" 
                    value={naicsCodes} 
                    onChange={(e) => setNaicsCodes(e.target.value)} 
                    placeholder="e.g. 541511, 541512, 518210"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-left font-mono" 
                  />
                  <p className="text-xs text-slate-600 mt-1 text-left">Your primary NAICS codes — used for AI-powered winnability scoring</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1 text-left">DUNS Number</label>
                    <input 
                      type="text" 
                      value={duns} 
                      onChange={(e) => setDuns(e.target.value)} 
                      placeholder="e.g. 123456789"
                      maxLength={9}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-left font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1 text-left">SAM Registration Status</label>
                    <select
                      value={samStatus}
                      onChange={(e) => setSamStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-left"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1 text-left">Capabilities Statement Summary</label>
                  <textarea 
                    value={capabilitiesStatement} 
                    onChange={(e) => setCapabilitiesStatement(e.target.value)} 
                    placeholder="Summarize your company's core capabilities, past performance, and differentiators..."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-4 py-3 text-slate-200 outline-none transition-all text-left resize-none" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* API Keys Manager */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-8 flex flex-col gap-6 text-left">
          <div>
            <h2 className="text-2xl font-light text-white mb-2 flex items-center gap-2">
              <Key className="w-6 h-6 text-cyan-400" />
              API & Agent Keys
            </h2>
            <p className="text-slate-400 text-sm">
              Generate keys to allow third-party autonomous AI agents or local MCP servers to find opportunities and write proposals on your behalf.
            </p>
          </div>

          {newKeyToken && (
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm space-y-2">
              <span className="block font-medium">New Key Generated Successfully!</span>
              <span className="block text-xs text-slate-400">Copy this key now. For security, it will not be shown again.</span>
              <div className="flex gap-2 items-center bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-lg mt-2 font-mono text-xs select-all text-cyan-300">
                <span className="flex-1 break-all">{newKeyToken}</span>
                <button 
                  onClick={handleCopyKey}
                  className="p-1 hover:bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white transition-all shrink-0"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleGenerateKey} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Key Description/Name</label>
              <input 
                type="text" 
                value={keyName} 
                onChange={(e) => setKeyName(e.target.value)} 
                placeholder="e.g., Cursor Agent, MCP Server" 
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg px-3 py-2 text-slate-200 outline-none transition-all text-sm"
              />
            </div>
            <button 
              type="submit" 
              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 font-medium text-slate-200 hover:text-white transition-all rounded-lg text-sm shrink-0 h-[38px] flex items-center justify-center"
            >
              Generate Key
            </button>
          </form>

          <div className="border-t border-slate-850/60 pt-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-350">Active API Keys</h3>
            {loadingKeys ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              </div>
            ) : apiKeys.length > 0 ? (
              <div className="divide-y divide-slate-850/50">
                {apiKeys.map(k => (
                  <div key={k.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <span className="block text-sm font-medium text-slate-200">{k.name}</span>
                      <span className="block text-xs font-mono text-slate-500 mt-0.5">
                        Prefix: {k.prefix}... • Created: {new Date(k.created_at).toLocaleDateString()}
                      </span>
                      {k.last_used_at && (
                        <span className="block text-[10px] text-cyan-500 font-mono mt-0.5">
                          Last used: {new Date(k.last_used_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all shrink-0"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs py-4 text-center">No active API keys found.</p>
            )}
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
