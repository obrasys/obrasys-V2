"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserAccess } from "@/services/access-service";

/* =========================
   TYPES
========================= */

interface Profile {
  id: string;
  email: string;
  name?: string;
  company_id?: string;
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
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [access, setAccess] = useState<AccessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* =========================
     LOAD CONTEXT
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
        throw new Error("Perfil não encontrado");
      }

      /* ===== ACCESS (RPC) ===== */
      const accessData = await getUserAccess();

      console.log("✅ get_user_access OK:", accessData);

      /* ===== SET STATE ===== */
      setSession(currentSession);
      setUser(currentSession.user);
      setProfile(profileData);
      setAccess(accessData);
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
      toast.error("Erro ao carregar o seu acesso. Faça login novamente.");
      await supabase.auth.signOut();
      navigate("/login");
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
   HOOK
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
