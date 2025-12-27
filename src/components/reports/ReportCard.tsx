"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import NavButton from "@/components/NavButton"; // Assuming NavButton is used for navigation reports

interface ReportCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColorClass?: string;
  buttonText: string;
  onClick?: () => void; // For generating PDF reports
  to?: string; // For navigating to other pages (e.g., Livro de Obra)
  disabled?: boolean;
  isLoading?: boolean;
  infoText?: string; // Optional text for additional info/warnings
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
  const ButtonComponent = to ? NavButton : Button;

  return (
    <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <Icon className={cn("h-8 w-8", iconColorClass)} />
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
        {infoText && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">{infoText}</p>
        )}
        <ButtonComponent
          className="mt-6 w-full"
          onClick={onClick}
          to={to || "#"} // Provide a default empty string for 'to' if not present
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> A Gerar...
            </>
          ) : (
            buttonText
          )}
        </ButtonComponent>
      </CardContent>
    </Card>
  );
};

export default ReportCard;