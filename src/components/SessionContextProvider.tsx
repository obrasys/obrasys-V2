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
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle(); // ✅ nunca lança 406

    if (error) {
      console.error("[SessionContext] Erro ao carregar profile:", error);
      return null;
    }

    return data as Profile | null;
  };

  /* ------------------------------------------------------------------ */
  /* 🚀 Inicialização da sessão                                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

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

      setIsLoading(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // Já tratamos a sessão inicial; evita duplicidade e concorrência
        if (event === "INITIAL_SESSION") return;

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

        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
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