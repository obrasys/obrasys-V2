"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlanId = "iniciante" | "profissional" | "empresa";

interface PlanCardProps {
  planId: PlanId;              // 🔑 identificador lógico
  planName: string;            // 🧾 label visual
  description: string;
  priceLabel: string;          // 🧾 apenas visual
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  onSelectPlan: (planId: PlanId) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  planId,
  planName,
  description,
  priceLabel,
  features,
  isPopular = false,
  buttonText,
  onSelectPlan,
  disabled = false,
  isLoading = false,
}) => {
  return (
    <Card
      className={cn(
        "relative flex flex-col justify-between p-6 border-2",
        isPopular ? "border-primary shadow-lg" : "border-border"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
          Mais Popular
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold">
          {planName}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {description}
        </p>
        <p className="text-4xl font-extrabold mt-4">
          {priceLabel}
        </p>
      </CardHeader>

      <CardContent className="flex-grow">
        <ul className="space-y-2 text-sm">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-6">
        <Button
          className="w-full"
          onClick={() => onSelectPlan(planId)}
          disabled={disabled || isLoading}
          variant={isPopular ? "default" : "outline"}
        >
          {isLoading ? "A processar…" : buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
