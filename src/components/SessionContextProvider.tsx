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
  companyId?: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* 🔐 Função única para carregar profile                               */
  /* ------------------------------------------------------------------ */
  const loadProfile = async (currentUser: User) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (!error && data) {
      return data as Profile;
    }

    if (error && error.code !== "PGRST116") {
      console.error("[SessionContext] Erro ao carregar profile:", error);
      return null;
    }

    // Não existe perfil: não inserir no cliente. Aguarda curto prazo pela criação server-side.
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

    return null;
  };

  /* ------------------------------------------------------------------ */
  /* 🚀 Gestão de sessão: única fonte via onAuthStateChange              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        if (!currentSession || event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setProfile(null);
          setCompanyId(null);
          lastLoadedUserIdRef.current = null;
          setIsLoading(false);
          return;
        }

        // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, etc.
        setSession(currentSession);
        setUser(currentSession.user);

        // Fonte única da empresa ativa: função RPC current_company_id()
        const { data: rpcCompanyId, error: rpcErr } = await supabase.rpc('current_company_id');
        if (rpcErr) {
          console.error("[SessionContext] Erro ao obter company_id via RPC:", rpcErr);
          setCompanyId(null);
        } else {
          // rpcCompanyId pode ser null; normal se não houver membership
          setCompanyId(rpcCompanyId ? String(rpcCompanyId) : null);
        }

        const currentUser = currentSession.user;
        if (currentUser && lastLoadedUserIdRef.current !== currentUser.id) {
          const profileData = await loadProfile(currentUser);
          if (mounted) {
            setProfile(profileData);
            lastLoadedUserIdRef.current = currentUser.id;
          }
        }

        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading, companyId }}>
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