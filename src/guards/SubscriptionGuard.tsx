"use client";

import React from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SubscriptionGuardProps {
  children: React.ReactNode;

  /**
   * Estados permitidos.
   * Por default, só deixa entrar se estiver ACTIVE
   */
  allow?: Array<"active" | "attention">;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  allow = ["active"],
}) => {
  const { user, isLoading: isSessionLoading } = useSession();

  const companyId = (user as any)?.company_id ?? null;

  const {
    data: subscription,
    loading: isLoadingSubscription,
  } = useSubscriptionStatus(companyId ?? undefined);

  /**
   * ======================================================
   * LOADING GLOBAL
   * ======================================================
   */
  if (isSessionLoading || isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  /**
   * ======================================================
   * NÃO AUTENTICADO
   * ======================================================
   */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /**
   * ======================================================
   * SEM SUBSCRIÇÃO (caso extremo)
   * ======================================================
   */
  if (!subscription) {
    return <Navigate to="/plans" replace />;
  }

  /**
   * ======================================================
   * ESTADO NÃO PERMITIDO
   * ======================================================
   */
  if (!allow.includes(subscription.computed_status)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="flex justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>

          <h2 className="text-lg font-semibold">
            Acesso restrito
          </h2>

          <p className="text-sm text-muted-foreground">
            O seu plano atual não permite aceder a esta funcionalidade.
          </p>

          <Button
            onClick={() => (window.location.href = "/plans")}
            className="w-full"
          >
            Ver Planos
          </Button>
        </Card>
      </div>
    );
  }

  /**
   * ======================================================
   * ACESSO LIBERADO
   * ======================================================
   */
  return <>{children}</>;
};

export default SubscriptionGuard;
