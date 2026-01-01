"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import NavButton from "@/components/NavButton";

interface ReportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColorClass?: string;

  buttonText: string;

  /** Ação direta (ex: gerar PDF) */
  onClick?: () => void;

  /** Navegação (ex: ir para Livro de Obra) */
  to?: string;

  disabled?: boolean;
  isLoading?: boolean;

  /** Texto informativo (avisos, pré-requisitos, etc.) */
  infoText?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  icon: Icon,
  iconColorClass = "text-blue-500 dark:text-blue-400",
  buttonText,
  onClick,
  to,
  disabled = false,
  isLoading = false,
  infoText,
}) => {
  // Proteção contra uso incorreto
  if (
    process.env.NODE_ENV !== "production" &&
    ((onClick && to) || (!onClick && !to))
  ) {
    console.warn(
      `[ReportCard] Uso inválido: informe apenas 'onClick' OU 'to'.`,
      { title }
    );
  }

  return (
    <Card className="bg-card border border-border transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Icon className={cn("h-8 w-8", iconColorClass)} />
        <CardTitle className="text-xl font-semibold">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>

        {infoText && (
          <div className="mt-3 flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span>{infoText}</span>
          </div>
        )}

        <div className="mt-6">
          {to ? (
            <NavButton
              to={to}
              className="w-full"
              disabled={disabled || isLoading}
            >
              {buttonText}
            </NavButton>
          ) : (
            <Button
              className="w-full"
              onClick={onClick}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A gerar…
                </>
              ) : (
                buttonText
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
