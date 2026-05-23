'use client';

import React from 'react';
import Image from 'next/image';
import { Shield, Home, FileText, Target, Activity, Settings, User } from 'lucide-react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-200 flex overflow-hidden">
      
      {/* Background Matrix Effect Overlay (Emerald/Gold effect) */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, #10B981 0%, transparent 40%), radial-gradient(circle at 100% 100%, #F59E0B 0%, transparent 40%)`
      }} />

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-xl flex flex-col z-10">
        <div className="h-20 flex items-center px-8 border-b border-slate-700/50 gap-3">
          <div className="relative flex items-center justify-center">
            {/* Replace with Grants Logo when available */}
            <div className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
               <Shield className="w-6 h-6 text-emerald-400" />
               CUES <span className="text-emerald-400 font-light">GRANTS</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          <NavItem icon={<Home />} label="Overview" active />
          <NavItem icon={<FileText />} label="Active Grants" />
          <NavItem icon={<Target />} label="Eligibility" />
          <NavItem icon={<Activity />} label="Analytics" />
        </nav>
        
        <div className="p-4 mt-auto">
          <NavItem icon={<Settings />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 h-screen overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0">
          <h1 className="text-2xl font-light tracking-wide text-white">GRANTS DASHBOARD</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Online</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Lloyd Pearson (Admin)</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-8 flex flex-col gap-8 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
      active 
      ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 border border-emerald-500/30' 
      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`}>
      {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-5 h-5' })}
      {label}
    </button>
  );
}
