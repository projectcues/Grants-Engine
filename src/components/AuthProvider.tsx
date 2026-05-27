'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  full_name: string | null;
  organization_name: string | null;
  cage_code: string | null;
  uei: string | null;
  naics_codes: string[];
  duns: string | null;
  sam_registration_status: string;
  capabilities_statement: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

/**
 * Hook to access the current authenticated user and their profile.
 * Must be used within an <AuthProvider>.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Provides authenticated user data and profile across the app.
 * Wraps children with auth state, auto-refreshes on auth changes.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile({
        id: data.id,
        full_name: data.full_name,
        organization_name: data.organization_name,
        cage_code: data.cage_code,
        uei: data.uei,
        naics_codes: data.naics_codes || [],
        duns: data.duns,
        sam_registration_status: data.sam_registration_status || 'unknown',
        capabilities_statement: data.capabilities_statement,
        role: data.role || 'user',
      });
    }
  };

  useEffect(() => {
    // Initial load
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadProfile(user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        if (newUser) {
          await loadProfile(newUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
