"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { getUserAccess } from "../services/access-service";

/* =========================
   TYPES
========================= */

interface Profile {
  id: string;
  email: string;
  name?: string;
  company_id?: string | null;
  role?: string;
}

interface AccessData {
  plan: string;
  trialEndsAt?: string;
  features: Record<string, boolean>;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  access: AccessData | null;
  isLoading: boolean;
}

/* =========================
   CONTEXT
========================= */

const SessionContext = createContext<SessionContextType | undefined>(
  undefined
);

/* =========================
   PROVIDER
========================= */

export const SessionContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [access, setAccess] = useState<AccessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* =========================
     LOAD USER CONTEXT
  ========================= */

  const loadUserContext = async (currentSession: Session | null) => {
    setIsLoading(true);

    if (!currentSession?.user) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setAccess(null);
      setIsLoading(false);
      return;
    }

    try {
      const userId = currentSession.user.id;

      /* ===== PROFILE ===== */
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

      if (profileError || !profileData) {
        throw new Error("Perfil não encontrado ou duplicado");
      }

      /* ===== ENSURE COMPANY (ONBOARDING AUTOMÁTICO) ===== */
      if (!profileData.company_id) {
        await supabase.rpc("ensure_user_company");
      }

      /* ===== RELOAD PROFILE (já com company_id) ===== */
      const { data: updatedProfile, error: reloadError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

      if (reloadError || !updatedProfile) {
        throw new Error("Erro ao atualizar perfil com empresa");
      }

      /* ===== ACCESS (RPC) ===== */
      const accessData = await getUserAccess();

      /* ===== SET STATE ===== */
      setSession(currentSession);
      setUser(currentSession.user);
      setProfile(updatedProfile);
      setAccess(accessData);
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
      toast.error(
        "Erro ao carregar o seu ambiente. Faça login novamente."
      );
      await supabase.auth.signOut();
      window.location.href = "/login";
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     AUTH LISTENER
  ========================= */

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await loadUserContext(session);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await loadUserContext(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* =========================
     PROVIDER RENDER
  ========================= */

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        profile,
        access,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

/* =========================
   HOOKS
========================= */

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error(
      "useSessionContext deve ser usado dentro do SessionContextProvider"
    );
  }
  return context;
};

/**
 * ✅ Alias para compatibilidade
 */
export const useSession = useSessionContext;
