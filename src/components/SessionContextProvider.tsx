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
      signOut: async () => { },
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
    first_name:
      (user.user_metadata as any)?.full_name
        ? String((user.user_metadata as any)?.full_name).split(" ")[0] || null
        : ((user.user_metadata as any)?.first_name ?? null),
    last_name:
      (user.user_metadata as any)?.full_name
        ? String((user.user_metadata as any)?.full_name).split(" ").slice(1).join(" ") || null
        : ((user.user_metadata as any)?.last_name ?? null),
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

  // evita corridas: uma "trava" por userId durante bootstrap/refresh
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

      // Se já estamos em voo para esse user, reutiliza
      const existingInFlight = inFlightByUserIdRef.current[userId];
      if (existingInFlight) return existingInFlight;

      // Inicia tentativa única para esse userId
      const p = (async () => {
        const ensured = await ensureProfileExists(u);
        if (!ensured) {
          console.warn("[Session] Perfil não disponível (RLS/DB/Network).");
        }
        setProfile(ensured ?? null);
        return ensured ?? null;
      })();

      inFlightByUserIdRef.current[userId] = p;

      try {
        return await p;
      } finally {
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

    async function initializeSession() {
      try {
        // 1. Get the current session from the server (validate token)
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error || !authUser) {
          // If no user on server, we are likely signed out or token expired
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }

        // 2. Hydrate session if user exists
        const { data: { session: s } } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(s ?? null);
        setUser(authUser);

        // 3. Load profile (CRITICAL: Wait for this before setting isLoading=false)
        if (authUser) {
          await safeLoadProfile(authUser);
        }

      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // NOTE: onAuthStateChange fires 'INITIAL_SESSION' immediately if configured, 
      // but we are doing manual bootstrapping to ensure getUser() validation.
      // We should trust the event for SIGN_IN, SIGN_OUT, TOKEN_REFRESHED.

      if (!mounted) return;

      // Update basic state
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsLoading(false);
      } else if (newSession?.user) {
        // For token refresh or sign in, reload profile
        // This *might* be redundant with bootstrap but handles updates
        await safeLoadProfile(newSession.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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