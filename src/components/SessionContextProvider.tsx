"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
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
  /* 🔐 BOOTSTRAP ÚNICO                                 */
  /* -------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  /* -------------------------------------------------- */
  /* 🚀 AUTH STATE CHANGE (ÚNICA FONTE)                  */
  /* -------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          if (!mounted) return;

          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (!currentSession) {
            setProfile(null);
            setIsLoading(false);
            return;
          }

          // 🔴 PERFIL É A ÚNICA VERDADE
          const { data: profileData, error } =
            await supabase
              .from("profiles")
              .select("*")
              .eq("id", currentSession.user.id)
              .single();

          if (error) {
            console.error("Erro ao carregar profile:", error);
            setProfile(null);
          } else {
            setProfile(profileData as Profile);
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
