"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { format, differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CompanySubscriptionStatus } from "@/schemas/subscription-schema";

interface TrialBannerProps {
  subscription: CompanySubscriptionStatus;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ subscription }) => {
  const now = new Date();

  const {
    subscription_plan,
    subscription_status,
    trial_end,
    current_period_end,
    computed_status,
  } = subscription;

  const trialEndDate = trial_end ? parseISO(trial_end) : null;
  const trialDaysRemaining = trialEndDate
    ? Math.max(0, differenceInDays(trialEndDate, now))
    : null;

  const renewalDate = current_period_end
    ? parseISO(current_period_end)
    : null;
  const renewDays = renewalDate
    ? Math.max(0, differenceInDays(renewalDate, now))
    : null;

  const prettyPlan = (subscription_plan || "trialing").replace("_", " ");

  let bannerContent = "";
  let subText = "";
  let icon: React.ReactNode = null;
  let bgColorClass = "";
  let textColorClass = "";
  let buttonText = "Ver Planos";
  let buttonVariant: "default" | "outline" | "destructive" = "default";
  let buttonLink = "/plans";
  let badgeText: string | null = null;
  let badgeClass = "";

  /**
   * ======================================================
   * ESTADO EXPIRADO (prioridade máxima)
   * ======================================================
   */
  if (computed_status === "expired") {
    icon = <XCircle className="h-5 w-5" />;
    bgColorClass = "bg-red-50 dark:bg-red-950";
    textColorClass = "text-red-800 dark:text-red-200";
    bannerContent = "A sua assinatura expirou.";
    subText = "Ative um plano para continuar a utilizar o Obra Sys.";
    buttonText = "Ativar Assinatura";
    buttonVariant = "destructive";
  }

  /**
   * ======================================================
   * TRIAL
   * ======================================================
   */
  else if (subscription_plan === "trialing") {
    if (trialDaysRemaining !== null && trialDaysRemaining > 0) {
      icon = <Clock className="h-5 w-5" />;
      bgColorClass = "bg-blue-50 dark:bg-blue-950";
      textColorClass = "text-blue-800 dark:text-blue-200";
      bannerContent = "Trial gratuito ativo";
      subText = `Faltam ${trialDaysRemaining} dia(s) • ${
        trialEndDate ? format(trialEndDate, "dd/MM/yyyy") : ""
      }`;
      buttonText = "Ativar Plano";
      badgeText = `${trialDaysRemaining}d`;
      badgeClass = "bg-blue-600 text-white";
    } else {
      icon = <XCircle className="h-5 w-5" />;
      bgColorClass = "bg-red-50 dark:bg-red-950";
      textColorClass = "text-red-800 dark:text-red-200";
      bannerContent = "O seu trial gratuito terminou.";
      buttonText = "Ativar Assinatura";
      buttonVariant = "destructive";
    }
  }

  /**
   * ======================================================
   * ATIVO
   * ======================================================
   */
  else if (computed_status === "active") {
    icon = <CheckCircle className="h-5 w-5" />;
    bgColorClass = "bg-emerald-50 dark:bg-emerald-950";
    textColorClass = "text-emerald-800 dark:text-emerald-200";
    bannerContent = `Plano ${prettyPlan} ativo.`;

    if (renewDays !== null && renewalDate) {
      subText = `Renova em ${renewDays} dia(s) • ${format(
        renewalDate,
        "dd/MM/yyyy"
      )}`;
      badgeText = `${renewDays}d`;
      badgeClass = "bg-emerald-600 text-white";
    } else {
      subText = "Renovação automática ativa.";
    }

    buttonText = "Gerir Assinatura";
    buttonVariant = "outline";
    buttonLink = "/profile?tab=company";
  }

  /**
   * ======================================================
   * ATENÇÃO (suspended / past_due)
   * ======================================================
   */
  else if (computed_status === "attention") {
    icon = <Info className="h-5 w-5" />;
    bgColorClass = "bg-yellow-50 dark:bg-yellow-950";
    textColorClass = "text-yellow-800 dark:text-yellow-200";
    bannerContent = "A sua assinatura requer atenção.";
    subText = "Verifique dados de pagamento ou contacte o suporte.";
    buttonText = "Gerir Assinatura";
    buttonVariant = "outline";
    buttonLink = "/profile?tab=company";
  }

  else {
    return null;
  }

  return (
    <Card
      className={cn(
        "p-4 flex items-center justify-between gap-4",
        bgColorClass,
        textColorClass
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex flex-col">
          <p className="font-medium text-sm md:text-base">
            {bannerContent}
          </p>
          {subText && (
            <p className="text-xs md:text-sm opacity-80">{subText}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {badgeText && <Badge className={badgeClass}>{badgeText}</Badge>}
        <Button asChild variant={buttonVariant} className="flex-shrink-0">
          <Link to={buttonLink}>{buttonText}</Link>
        </Button>
      </div>
    </Card>
  );
};

export default TrialBanner;
