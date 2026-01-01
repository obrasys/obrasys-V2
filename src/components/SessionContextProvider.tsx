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
  email?: string;
  first_name?: string;
  last_name?: string;
  company_id?: string | null;
  role?: string;
  avatar_url?: string;
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
     AUTH LISTENER (MÍNIMO)
  ========================= */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =========================
     LOAD PROFILE + ACCESS
  ========================= */

  useEffect(() => {
    let cancelled = false;

    const loadProfileAndAccess = async () => {
      setIsLoading(true);

      if (!user) {
        setProfile(null);
        setAccess(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (error || !profileData) {
          throw error ?? new Error("Perfil não encontrado");
        }

        const accessData = await getUserAccess();

        if (cancelled) return;

        setProfile(profileData);
        setAccess(accessData);
      } catch (err) {
        console.error("Erro ao carregar contexto:", err);
        toast.error(
          "Erro ao minimizar o ambiente. Faça login novamente."
        );
        await supabase.auth.signOut();
        window.location.href = "/login";
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfileAndAccess();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
