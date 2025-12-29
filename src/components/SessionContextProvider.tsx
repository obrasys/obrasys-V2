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
  const authEventReceivedRef = useRef<boolean>(false);

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

    // Poll curto aguardando criação server-side (sem inserir no cliente)
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
  /* 🚀 Fonte única: onAuthStateChange + failsafe de loading             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    authEventReceivedRef.current = false;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        authEventReceivedRef.current = true;

        if (!currentSession || event === "SIGNED_OUT") {
          // Limpa tudo ao sair
          setSession(null);
          setUser(null);
          setProfile(null);
          lastLoadedUserIdRef.current = null;
          setIsLoading(false);
          return;
        }

        // INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED
        setSession(currentSession);
        setUser(currentSession.user);

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

    // Failsafe: se nenhum evento chegar, terminar loading para evitar travar
    const failsafe = setTimeout(() => {
      if (!authEventReceivedRef.current) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      clearTimeout(failsafe);
    };
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