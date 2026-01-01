"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, profile, isLoading } = useSession();
  const location = useLocation();

  // ⏳ Enquanto auth OU profile estão a carregar
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          A verificar sessão…
        </span>
      </div>
    );
  }

  // 🔒 Não autenticado → Login
  if (!session?.user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // ⚠️ Autenticado mas sem profile
  // → NÃO é erro, é onboarding ou atraso de carregamento
  // → Deixa passar (ou redireciona para onboarding específico se quiseres)
  if (!profile) {
    return <>{children}</>;
    // alternativa futura:
    // return <Navigate to="/profile" replace />;
  }

  // ✅ Autenticado + profile ok
  return <>{children}</>;
};

export default ProtectedRoute;
