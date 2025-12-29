"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-sm text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  if (!session && !isLoading) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;