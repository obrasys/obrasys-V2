"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/schemas/profile-schema";

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* 🔐 Função única para carregar profile                               */
  /* ------------------------------------------------------------------ */
  const loadProfile = async (currentUser: User) => {
    // Tenta obter perfil
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    // Se encontrou, devolve
    if (!error && data) {
      return data as Profile;
    }

    // Se houve erro inesperado, regista e devolve null
    if (error && error.code !== "PGRST116") {
      console.error("[SessionContext] Erro ao carregar profile:", error);
      return null;
    }

    // Não existe perfil: NÃO insere no cliente (evita falhas de RLS).
    // Espera curta para o trigger server-side criar o perfil.
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((res) => setTimeout(res, 500));
      const { data: pData, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!pErr && pData) {
        return pData as Profile;
      }
      if (pErr && pErr.code !== "PGRST116") {
        console.error("[SessionContext] Erro ao aguardar profile:", pErr);
        break;
      }
    }

    // Ainda sem perfil: devolve null e deixa o app seguir com user autenticado
    return null;
  };

  /* ------------------------------------------------------------------ */
  /* 🚀 Inicialização da sessão                                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session ?? null);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (lastLoadedUserIdRef.current !== session.user.id || profile === null) {
            const profileData = await loadProfile(session.user);
            if (mounted) {
              setProfile(profileData);
              lastLoadedUserIdRef.current = session.user.id;
            }
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("[SessionContext] getSession falhou:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {

        if (!mounted) return;

        setSession(currentSession ?? null);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          if (lastLoadedUserIdRef.current !== currentSession.user.id || profile === null) {
            const profileData = await loadProfile(currentSession.user);
            if (mounted) {
              setProfile(profileData);
              lastLoadedUserIdRef.current = currentSession.user.id;
            }
          }
        } else {
          setProfile(null);
        }

        // Qualquer evento de auth deve garantir fim do loading
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Failsafe: caso algo trave, garantir que loading termina
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
    }, 7000);
    return () => clearTimeout(t);
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionContextProvider");
  }
  return context;
};