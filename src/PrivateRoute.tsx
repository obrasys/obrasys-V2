"use client";

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";

const PrivateRoute: React.FC = () => {
  const { session, isLoading } = useSession();
  const location = useLocation();

  // ⏳ Enquanto carrega a sessão
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          A verificar sessão…
        </span>
      </div>
    );
  }

  // 🔒 Sem sessão → Login
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // ✅ Sessão válida → continua
  return <Outlet />;
};

export default PrivateRoute;
