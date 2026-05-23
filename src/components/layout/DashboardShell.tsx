'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Shield, Home, FileText, Target, Activity, Settings, User, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
      }
    };
    fetchUser();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-200 flex overflow-hidden">
      
      {/* Background Matrix Effect Overlay (Emerald/Gold effect) */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 50% 0%, #10B981 0%, transparent 40%), radial-gradient(circle at 100% 100%, #F59E0B 0%, transparent 40%)`
      }} />

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-xl flex flex-col z-10">
        <div className="h-20 flex items-center px-8 border-b border-slate-700/50 gap-3">
          <div className="relative flex items-center justify-center w-full">
            <Image src="/logo.png" alt="Project Cues Grants" width={180} height={52} className="object-contain" priority />
          </div>
        </div>
        
        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          <NavItem href="/" icon={<Home />} label="Overview" active={pathname === '/'} />
          <NavItem href="/active-projects" icon={<FileText />} label="Active Grants" active={pathname === '/active-projects'} />
          <NavItem href="/eligibility" icon={<Target />} label="Eligibility" active={pathname === '/eligibility'} />
          <NavItem href="/analytics" icon={<Activity />} label="Analytics" active={pathname === '/analytics'} />
        </nav>
        
        <div className="p-4 mt-auto">
          <NavItem href="/settings" icon={<Settings />} label="Settings" active={pathname === '/settings'} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 h-screen overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20">
          <h1 className="text-2xl font-light tracking-wide text-white">GRANTS DASHBOARD</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Online</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{userEmail || 'Loading...'}</span>
              </div>
              <button onClick={handleSignOut} className="hover:text-white transition-colors" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
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

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
      active 
      ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 border border-emerald-500/30' 
      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`}>
      {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-5 h-5' })}
      {label}
    </Link>
  );
}
