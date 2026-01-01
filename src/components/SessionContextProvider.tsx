"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Profile } from "@/schemas/profile-schema";

/**
 * Hardening rules:
 * - NO throw in frontend
 * - Always degrade gracefully
 * - Avoid duplicate profile creation on refresh (race conditions)
 */

type SessionContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession(): SessionContextType {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    // No throw: return a safe fallback with console error
    console.error("[SessionContext] useSession chamado fora do Provider");
    return {
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      refreshProfile: async () => null,
      signOut: async () => {},
    };
  }
  return ctx;
}

async function fetchProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profiles.select] erro:", error);
    return null;
  }

  return (data as Profile) ?? null;
}

async function ensureProfileExists(user: User): Promise<Profile | null> {
  const userId = user.id;

  // 1) tentar buscar
  const existing = await fetchProfileByUserId(userId);
  if (existing) return existing;

  // 2) criar / upsert (sem duplicar)
  const payload: Partial<Profile> = {
    id: userId,
    email: user.email ?? null,
    full_name:
      (user.user_metadata as any)?.full_name ??
      (user.user_metadata as any)?.name ??
      null,
    avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: upserted, error: upsertError } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (upsertError) {
    console.error("[profiles.upsert] erro:", upsertError);
    return null;
  }

  return (upserted as Profile) ?? null;
}

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // evita corridas: uma “trava” por userId durante bootstrap/refresh
  const inFlightByUserIdRef = useRef<Record<string, Promise<Profile | null> | null>>(
    {}
  );

  const safeLoadProfile = useCallback(
    async (u: User | null): Promise<Profile | null> => {
      if (!u) {
        setProfile(null);
        return null;
      }

      const userId = u.id;
      const existingInFlight = inFlightByUserIdRef.current[userId];
      if (existingInFlight) return existingInFlight;

      const p = (async () => {
        const ensured = await ensureProfileExists(u);
        if (!ensured) {
          // feedback sem crash
          console.warn("[Session] Perfil não disponível (RLS/DB/Network).");
        }
        setProfile(ensured);
        return ensured;
      })();

      inFlightByUserIdRef.current[userId] = p;

      try {
        return await p;
      } finally {
        // libera a trava depois
        inFlightByUserIdRef.current[userId] = null;
      }
    },
    []
  );

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("[auth.getUser] erro:", error);
        return null;
      }

      return await safeLoadProfile(authUser ?? null);
    } catch (e) {
      console.error("[refreshProfile] erro inesperado:", e);
      return null;
    }
  }, [safeLoadProfile]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[auth.signOut] erro:", error);
        toast.error("Erro ao terminar sessão.");
        return;
      }
      // limpar estado local
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (e) {
      console.error("[signOut] erro inesperado:", e);
      toast.error("Erro ao terminar sessão.");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setIsLoading(true);

      try {
        const {
          data: { session: s },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[auth.getSession] erro:", error);
          if (!mounted) return;
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (!mounted) return;

        setSession(s ?? null);
        setUser(s?.user ?? null);

        await safeLoadProfile(s?.user ?? null);
      } catch (e) {
        console.error("[Session bootstrap] erro inesperado:", e);
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        // NÃO usar throw aqui. Apenas atualizar estado com segurança.
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
        await safeLoadProfile(newSession?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [safeLoadProfile]);

  const value = useMemo<SessionContextType>(
    () => ({
      session,
      user,
      profile,
      isLoading,
      refreshProfile,
      signOut,
    }),
    [session, user, profile, isLoading, refreshProfile, signOut]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
