"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, companyId, profile } = useSession();
  const location = useLocation();

  const path = location.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  const isSelectCompanyPage = path === "/select-company";

  // 1️⃣ Enquanto o contexto não está pronto, NÃO decidir nada
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-sm text-muted-foreground">
          A carregar...
        </div>
      </div>
    );
  }

  // 2️⃣ Autenticação: só depende do user
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3️⃣ Se o profile ainda não carregou, aguarda
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-sm text-muted-foreground">
          A preparar o seu ambiente...
        </div>
      </div>
    );
  }

  // 4️⃣ Empresa ativa só é obrigatória DEPOIS do profile existir
  if (!companyId && !isAuthPage && !isSelectCompanyPage) {
    return <Navigate to="/select-company" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
