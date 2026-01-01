"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, isLoading } = useSession();
  const location = useLocation();

  // ⏳ Enquanto a sessão está a ser resolvida
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

  // ✅ Autenticado (inclui trial)
  return <>{children}</>;
};

export default ProtectedRoute;