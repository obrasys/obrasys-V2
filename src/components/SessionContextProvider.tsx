"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Profile } from '@/schemas/profile-schema'; // Import Profile schema

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

        setIsLoading(false); // Definir loading como falso após o estado de autenticação ser determinado

        const currentPath = location.pathname;
        const isAuthPage = currentPath === '/login' || currentPath === '/signup';

        if (currentSession) { // Utilizador autenticado
          if (isAuthPage) { // Redirecionar apenas se estiver numa página de autenticação
            navigate('/dashboard');
            toast.success('Sessão iniciada com sucesso!');
          }
        } else { // Utilizador NÃO autenticado
          if (!isAuthPage && currentPath !== '/login') { // Redirecionar apenas se estiver numa página protegida E não estiver já no login
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
      setProfile(fetchedProfile); // Set profile data

      setIsLoading(false); // Definir loading como falso após a sessão inicial ser determinada

      const currentPath = location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/signup';

      if (!session && !isAuthPage && currentPath !== '/login') { // Redirecionar utilizadores não autenticados de páginas protegidas no carregamento inicial
        navigate('/login');
      } else if (session && isAuthPage) { // Redirecionar utilizadores autenticados de páginas de autenticação no carregamento inicial
        navigate('/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]); // Removido location.pathname das dependências

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