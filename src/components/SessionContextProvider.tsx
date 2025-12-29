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
  setActiveCompany?: (companyId: string | null) => Promise<void>;
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

    // Aguarda curto prazo pela criação server-side.
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

  // Define explicitamente a empresa ativa (grava em perfil e sincroniza abas)
  const setActiveCompany = async (newCompanyId: string | null) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ active_company_id: newCompanyId })
      .eq("id", user.id);
    if (error) {
      console.error("[SessionContext] Falha ao definir active_company_id:", error);
      throw error;
    }
    // Atualiza estado local e sincroniza via storage
    setCompanyId(newCompanyId);
    try {
      if (newCompanyId) {
        localStorage.setItem("active_company_id", newCompanyId);
      } else {
        localStorage.removeItem("active_company_id");
      }
    } catch (_) {
      // ignore storage errors
    }
  };

  /* ------------------------------------------------------------------ */
  /* 🚀 onAuthStateChange como fonte única                               */
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

        setSession(currentSession);
        setUser(currentSession.user);

        const currentUser = currentSession.user;
        if (currentUser && lastLoadedUserIdRef.current !== currentUser.id) {
          const profileData = await loadProfile(currentUser);
          if (mounted) {
            setProfile(profileData);

            // Empresa ativa: primeiro tenta perfil.active_company_id
            const activeFromProfile = (profileData as any)?.active_company_id as string | null;
            if (activeFromProfile) {
              setCompanyId(activeFromProfile);
              try { localStorage.setItem("active_company_id", activeFromProfile); } catch (_) {}
            } else {
              // Sem empresa ativa definida: tenta sincronizar com localStorage
              let stored = null;
              try { stored = localStorage.getItem("active_company_id"); } catch (_) {}
              setCompanyId(stored || null);
            }

            lastLoadedUserIdRef.current = currentUser.id;
          }
        }

        setIsLoading(false);
      }
    );

    // Sincroniza abas quando active_company_id muda em outra aba
    const onStorage = (e: StorageEvent) => {
      if (e.key === "active_company_id") {
        setCompanyId(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, profile, isLoading, companyId, setActiveCompany }}>
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