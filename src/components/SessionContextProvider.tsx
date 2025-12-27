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

  async function ensureProfileExists(currentUser: User): Promise<Profile | null> {
    // Tenta ler o perfil; se não existir, cria um perfil básico
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Criar perfil mínimo
      const email = currentUser.email || '';
      const namePart = email.split('@')[0] || 'Utilizador';
      const firstName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const lastName = '';
      const { data: created, error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: currentUser.id,
          first_name: firstName,
          last_name: lastName,
          role: 'cliente',
          plan_type: 'trialing',
          // company_id ficará null até ser associado
        })
        .select('*')
        .single();
      if (insertErr) {
        console.error('[SessionContext] Falha ao criar perfil:', insertErr);
        toast.error('Não foi possível criar o perfil do utilizador.');
        return null;
      }
      toast.success('Perfil criado com sucesso!');
      return created as Profile;
    }

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[SessionContext] Erro ao ler perfil:', profileError);
      toast.error('Falha ao carregar o perfil do utilizador.');
      return null;
    }

    return (profileData as Profile) || null;
  }

  useEffect(() => {
    // Processa Magic Link: tokens no hash da URL (#access_token, #refresh_token, type=magiclink)
    const handleMagicLink = async () => {
      const hash = window.location.hash || "";
      if (!hash) return;

      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const typeParam = params.get("type");

      // Se o link trouxe erro (ex.: otp_expired), informar e limpar hash
      if (error || errorCode) {
        toast.error("Link de confirmação inválido ou expirado. Reenvie a confirmação a partir da página de Login.");
        // Limpa o hash sem recarregar a página
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        return;
      }

      // Se for Magic Link com tokens válidos, criar sessão imediatamente
      if (typeParam === "magiclink" && accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        // Limpa o hash da URL após criar a sessão
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        toast.success("Conta confirmada! Sessão iniciada.");
        navigate("/dashboard");
      }
    };

    // Executa processamento de Magic Link antes de configurar o listener
    void handleMagicLink();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        let fetchedProfile: Profile | null = null;
        if (currentSession?.user) {
          fetchedProfile = await ensureProfileExists(currentSession.user);
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
        fetchedProfile = await ensureProfileExists(session.user);
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