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

  // ⏳ Enquanto sessão + profile estão a ser resolvidos
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

  // ⛔ Sessão existe mas profile não (estado inválido)
  if (!profile) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // ✅ Autenticado + profile válido (trial incluído)
  return <>{children}</>;
};

export default ProtectedRoute;
