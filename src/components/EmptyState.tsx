"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean; // Adicionada esta prop
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
  buttonDisabled = false, // Valor padrão
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <Icon className="h-12 w-12 mb-4 text-gray-400 dark:text-gray-600" />
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm mb-6">{description}</p>
      {buttonText && onButtonClick && (
        <Button onClick={onButtonClick} variant="outline" disabled={buttonDisabled}> {/* Usar buttonDisabled aqui */}
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;