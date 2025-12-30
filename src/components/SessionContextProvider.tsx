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

export const SessionContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 refs para evitar loops e re-subscribes
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* 🔐 Carrega profile (apenas SELECT, aguarda trigger server-side)     */
  /* ------------------------------------------------------------------ */
  const loadProfile = async (currentUser: User): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("[SessionContext] Erro ao carregar profile:", error);
      return null;
    }

    if (data) return data as Profile;

    // aguarda trigger server-side criar o profile
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((res) => setTimeout(res, 500));

      const { data: retryData, error: retryErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (retryErr && retryErr.code !== "PGRST116") {
        console.error(
          "[SessionContext] Erro ao aguardar profile:",
          retryErr
        );
        return null;
      }

      if (retryData) return retryData as Profile;
    }

    return null;
  };

  /* ------------------------------------------------------------------ */
  /* 🏢 Define empresa ativa (fonte única: profiles.active_company_id)   */
  /* ------------------------------------------------------------------ */
  const setActiveCompany = async (newCompanyId: string | null) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ active_company_id: newCompanyId })
      .eq("id", user.id);

    if (error) {
      console.error(
        "[SessionContext] Falha ao definir active_company_id:",
        error
      );
      throw error;
    }

    setCompanyId(newCompanyId);

    const storageKey = `active_company_id:${user.id}`;
    try {
      if (newCompanyId) {
        localStorage.setItem(storageKey, newCompanyId);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      /* ignore */
    }
  };

  /* ------------------------------------------------------------------ */
  /* 🟢 BOOTSTRAP INICIAL (nova aba / refresh)                           */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setIsLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("[SessionContext] getSession falhou:", error);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        userIdRef.current = data.session.user.id;
      }

      setIsLoading(false);
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* 🚀 onAuthStateChange — REGISTRADO UMA ÚNICA VEZ                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        // 🔴 SIGNED OUT
        if (!currentSession || event === "SIGNED_OUT") {
          const uid = userIdRef.current;
          if (uid) {
            try {
              localStorage.removeItem(`active_company_id:${uid}`);
            } catch {
              /* ignore */
            }
          }

          setSession(null);
          setUser(null);
          setProfile(null);
          setCompanyId(null);
          userIdRef.current = null;
          lastLoadedUserIdRef.current = null;
          setIsLoading(false);
          return;
        }

        // 🟢 SIGNED IN / TOKEN REFRESH
        setSession(currentSession);
        setUser(currentSession.user);
        userIdRef.current = currentSession.user.id;

        const currentUser = currentSession.user;

        if (
          currentUser &&
          lastLoadedUserIdRef.current !== currentUser.id
        ) {
          const profileData = await loadProfile(currentUser);
          if (!mounted) return;

          setProfile(profileData);
          lastLoadedUserIdRef.current = currentUser.id;

          if (profileData) {
            const storageKey = `active_company_id:${currentUser.id}`;
            const activeFromProfile =
              (profileData as any)?.active_company_id ?? null;

            if (activeFromProfile) {
              setCompanyId(activeFromProfile);
              try {
                localStorage.setItem(storageKey, activeFromProfile);
              } catch {
                /* ignore */
              }
            } else {
              let stored: string | null = null;
              try {
                stored = localStorage.getItem(storageKey);
              } catch {
                /* ignore */
              }
              setCompanyId(stored);
            }
          }
        }

        setIsLoading(false);
      }
    );

    // 🔁 sincronização entre abas (empresa ativa)
    const onStorage = (e: StorageEvent) => {
      const uid = userIdRef.current;
      if (!uid) return;

      const expectedKey = `active_company_id:${uid}`;
      if (e.key === expectedKey) {
        setCompanyId(e.newValue);
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
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
        setActiveCompany,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error(
      "useSession must be used within SessionContextProvider"
    );
  }
  return context;
};
