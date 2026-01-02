"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CompanySubscriptionStatus } from "@/schemas/subscription-schema";

interface TrialBannerProps {
  subscription: CompanySubscriptionStatus;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ subscription }) => {
  const {
    subscription_plan,
    trial_end,
    current_period_end,
    computed_status,
  } = subscription;

  /**
   * ======================================================
   * FREE → não mostra banner
   * ======================================================
   */
  if (computed_status === "free") {
    return null;
  }

  const now = new Date();

  /**
   * Cálculo correto de dias restantes
   * (último dia mostra 1)
   */
  const daysRemaining = (endDate?: string | null) => {
    if (!endDate) return null;
    const end = parseISO(endDate);
    const diff =
      (end.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(diff));
  };

  const trialDaysRemaining = daysRemaining(trial_end);
  const renewDays = daysRemaining(current_period_end);

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
   * EXPIRADO
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
  else if (computed_status === "trialing") {
    if (trialDaysRemaining && trialDaysRemaining > 0) {
      icon = <Clock className="h-5 w-5" />;
      bgColorClass = "bg-blue-50 dark:bg-blue-950";
      textColorClass = "text-blue-800 dark:text-blue-200";
      bannerContent = "Trial gratuito ativo";
      subText = `Faltam ${trialDaysRemaining} dia(s) • ${
        trial_end ? format(parseISO(trial_end), "dd/MM/yyyy") : ""
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
    bannerContent = subscription_plan
      ? `Plano ${subscription_plan} ativo.`
      : "Assinatura ativa.";

    if (renewDays && current_period_end) {
      subText = `Renova em ${renewDays} dia(s) • ${format(
        parseISO(current_period_end),
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
   * ATENÇÃO
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
  } else {
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
            <p className="text-xs md:text-sm opacity-80">
              {subText}
            </p>
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
