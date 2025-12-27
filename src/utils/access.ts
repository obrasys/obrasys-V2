import { Profile } from "@/schemas/profile-schema";

type PlanType = "trialing" | "iniciante" | "profissional" | "empresa";

const planOrder: PlanType[] = ["trialing", "iniciante", "profissional", "empresa"];

export function isAdmin(profile: Profile | null): boolean {
  const role = (profile?.role || "").toLowerCase().trim();
  return role === "admin";
}

export function hasPlan(currentPlan: PlanType | string | null | undefined, requiredPlan: PlanType | string): boolean {
  const current = ((currentPlan || "trialing") as string).toLowerCase().trim() as PlanType;
  const required = (requiredPlan as string).toLowerCase().trim() as PlanType;
  return planOrder.indexOf(current) >= planOrder.indexOf(required);
}