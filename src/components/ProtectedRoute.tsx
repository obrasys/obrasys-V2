"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading, companyId } = useSession();
  const location = useLocation();

  const path = location.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  const isSelectCompanyPage = path === "/select-company";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-sm text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Empresa ativa obrigatória para páginas protegidas (exceto a própria seleção)
  if (!companyId && !isAuthPage && !isSelectCompanyPage) {
    return <Navigate to="/select-company" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;