"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  companyId: string | null;
  setActiveCompany: (companyId: string | null) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializedRef = useRef(false);

  /* ---------------------------------------------------- */
  /* 🔥 BOOTSTRAP COM RESET DE SESSÃO CORROMPIDA          */
  /* ---------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      // ⚠️ LIMPA qualquer sessão antiga inconsistente
      await supabase.auth.signOut({ scope: "local" });

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

  /* ---------------------------------------------------- */
  /* 🔐 AUTH STATE CHANGE (ÚNICA FONTE)                   */
  /* ---------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (!currentSession) {
          setProfile(null);
          setCompanyId(null);
          setIsLoading(false);
          return;
        }

        // 🔐 Carrega profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentSession.user.id)
          .single();

        setProfile(profileData ?? null);
        setCompanyId(profileData?.company_id ?? null);

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
        companyId,
        setActiveCompany: async () => {},
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionContextProvider");
  }
  return ctx;
};
