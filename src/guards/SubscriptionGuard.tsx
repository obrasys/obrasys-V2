import React from "react";
import { Navigate } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useSession } from "@/components/SessionContextProvider";

type Props = {
  requiredPlan?: "starter" | "pro";
  children: React.ReactNode;
};

export default function SubscriptionGuard({
  requiredPlan = "starter",
  children,
}: Props) {
  const { profile } = useSession();
  const { plan, isActive, loading } = useSubscriptionStatus(
    profile?.company_id
  );

  if (loading) return null;

  if (!isActive) {
    return <Navigate to="/plans" replace />;
  }

  const hierarchy = ["free", "starter", "pro"];

  if (
    hierarchy.indexOf(plan) <
    hierarchy.indexOf(requiredPlan)
  ) {
    return <Navigate to="/plans" replace />;
  }

  return <>{children}</>;
}
