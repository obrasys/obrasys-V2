"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setIsLoading(false); // Definir loading como falso após o estado de autenticação ser determinado

        const currentPath = location.pathname;
        const isAuthPage = currentPath === '/login' || currentPath === '/signup';

        if (currentSession) { // Utilizador autenticado
          if (isAuthPage && currentPath !== '/dashboard') { // Redirecionar apenas se estiver numa página de autenticação E não estiver já no dashboard
            navigate('/dashboard');
            toast.success('Sessão iniciada com sucesso!');
          }
        } else { // Utilizador NÃO autenticado
          if (!isAuthPage && currentPath !== '/login') { // Redirecionar apenas se estiver numa página protegida E não estiver já no login
            navigate('/login');
            if (event === 'SIGNED_OUT') {
              toast.info('Sessão terminada.');
            }
          }
        }
      }
    );

    // Buscar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false); // Definir loading como falso após a sessão inicial ser determinada

      const currentPath = location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/signup';

      if (!session && !isAuthPage && currentPath !== '/login') { // Redirecionar utilizadores não autenticados de páginas protegidas no carregamento inicial
        navigate('/login');
      } else if (session && isAuthPage && currentPath !== '/dashboard') { // Redirecionar utilizadores autenticados de páginas de autenticação no carregamento inicial
        navigate('/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]); // Removido location.pathname das dependências

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};