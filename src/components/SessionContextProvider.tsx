"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/schemas/profile-schema";

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(
  undefined
);

export const SessionContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* -------------------------------------------------- */
  /* 🔐 LOAD PROFILE (ÚNICA FONTE)                       */
  /* -------------------------------------------------- */
  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to load profile:", error);
      setProfile(null);
      return;
    }

    setProfile(data as Profile);
  }, []);

  /* -------------------------------------------------- */
  /* 🚀 AUTH STATE CHANGE (FONTE DE VERDADE)             */
  /* -------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const currentSession = data.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    };

    init();

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          if (!mounted) return;

          setIsLoading(true);

          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            await loadProfile(currentSession.user.id);
          } else {
            setProfile(null);
          }

          setIsLoading(false);
        }
      );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error(
      "useSession must be used within SessionContextProvider"
    );
  }
  return ctx;
};
