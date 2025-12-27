"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Profile } from '@/schemas/profile-schema'; // Import Profile schema
import { addDays, formatISO } from 'date-fns';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // NEW: Add profile to context
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // NEW: State for profile
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  async function ensureTrialSubscription(companyId: string | null | undefined) {
    if (!companyId) return;
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status, plan_type, trial_end, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError) {
      console.warn("[SessionContext] Falha ao verificar subscrição:", subError.message);
      return;
    }
    const hasSub = Array.isArray(sub) && sub.length > 0;
    if (!hasSub) {
      const trialEndDate = addDays(new Date(), 30);
      const { error: insertErr } = await supabase
        .from('subscriptions')
        .insert({
          company_id: companyId,
          status: 'trialing',
          plan_type: 'trialing',
          trial_start: formatISO(new Date()),
          trial_end: formatISO(trialEndDate),
        });
      if (insertErr) {
        console.warn("[SessionContext] Falha ao criar subscrição de trial:", insertErr.message);
      } else {
        toast.success("Subscrição de trial criada com sucesso!");
      }
    }
  }

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        let fetchedProfile: Profile | null = null;
        if (currentSession?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*') // Select all profile data
            .eq('id', currentSession.user.id)
            .single();
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile on auth state change:", profileError);
          } else if (profileData) {
            fetchedProfile = profileData;
          }
        }
        setProfile(fetchedProfile); // Set profile data

        setIsLoading(false);

        // Após login, garantir subscrição de trial para a empresa
        if (currentSession?.user) {
          await ensureTrialSubscription(fetchedProfile?.company_id);
        }

        const currentPath = location.pathname;
        const isAuthPage = currentPath === '/login' || currentPath === '/signup';

        if (currentSession) {
          if (isAuthPage) {
            navigate('/dashboard');
            toast.success('Sessão iniciada com sucesso!');
          }
        } else {
          if (!isAuthPage && currentPath !== '/login') {
            navigate('/login');
            if (event === 'SIGNED_OUT') {
              toast.info('Sessão terminada.');
            }
          }
        }
      }
    );

    // Buscar sessão inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);

      let fetchedProfile: Profile | null = null;
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile on initial session load:", profileError);
        } else if (profileData) {
          fetchedProfile = profileData;
        }
      }
      setProfile(fetchedProfile);

      setIsLoading(false);

      // Garantir subscrição também no carregamento inicial, quando já autenticado
      if (session?.user) {
        await ensureTrialSubscription(fetchedProfile?.company_id);
      }

      const currentPath = location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/signup';

      if (!session && !isAuthPage && currentPath !== '/login') {
        navigate('/login');
      } else if (session && isAuthPage) {
        navigate('/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};