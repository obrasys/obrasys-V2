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
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/* =========================
   TYPES
========================= */

export interface Profile {
  id: string;
  email: string;
  name?: string;
  company_id?: string;
  role?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: "trial" | "basic" | "pro" | "enterprise";
  status: "active" | "expired" | "cancelled";
  trial_start?: string;
  trial_end?: string;
}

export interface AccessControl {
  plan: Subscription["plan"];
  trialEndsAt?: string;
  features: Record<string, boolean>;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  access: AccessControl | null;
  isLoading: boolean;
}

/* =========================
   CONTEXT
========================= */

const SessionContext = createContext<SessionContextType | undefined>(undefined);

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
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);
  const [access, setAccess] = useState<AccessControl | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* =========================
     LOAD USER CONTEXT
  ========================= */

  const loadUserContext = useCallback(
    async (currentSession: Session | null) => {
      if (!currentSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setSubscription(null);
        setAccess(null);
        setIsLoading(false);
        return;
      }

      const userId = currentSession.user.id;

      try {
        /* ===== PROFILE ===== */
        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (profileError || !profileData) {
          throw new Error("Perfil não encontrado ou duplicado.");
        }

        /* ===== SUBSCRIPTION ===== */
        const { data: subscriptionData, error: subError } =
          await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .eq("status", "active")
            .single();

        if (subError || !subscriptionData) {
          throw new Error("Subscription ativa não encontrada.");
        }

        /* ===== ACCESS CONTROL ===== */
        const accessControl: AccessControl = {
          plan: subscriptionData.plan,
          trialEndsAt: subscriptionData.trial_end ?? undefined,
          features: resolveFeaturesByPlan(subscriptionData.plan),
        };

        /* ===== SET STATE ===== */
        setSession(currentSession);
        setUser(currentSession.user);
        setProfile(profileData);
        setSubscription(subscriptionData);
        setAccess(accessControl);
      } catch (error: any) {
        console.error("Erro ao carregar contexto:", error);

        toast.error(
          "Erro ao carregar o seu perfil. Contacte o suporte."
        );

        await supabase.auth.signOut();
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

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
        setIsLoading(true);
        await loadUserContext(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserContext]);

  /* =========================
     RENDER
  ========================= */

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        profile,
        subscription,
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
      "useSessionContext deve ser usado dentro de SessionContextProvider"
    );
  }
  return context;
};

/* =========================
   FEATURE RULES
========================= */

function resolveFeaturesByPlan(
  plan: Subscription["plan"]
): Record<string, boolean> {
  switch (plan) {
    case "trial":
      return {
        dashboard: true,
        budgets: true,
        invoices: true,
        exports: false,
        ai_assistant: false,
        integrations: false,
      };

    case "basic":
      return {
        dashboard: true,
        budgets: true,
        invoices: true,
        exports: true,
        ai_assistant: false,
        integrations: false,
      };

    case "pro":
      return {
        dashboard: true,
        budgets: true,
        invoices: true,
        exports: true,
        ai_assistant: true,
        integrations: true,
      };

    case "enterprise":
      return {
        dashboard: true,
        budgets: true,
        invoices: true,
        exports: true,
        ai_assistant: true,
        integrations: true,
        white_label: true,
      };

    default:
      return {};
  }
}