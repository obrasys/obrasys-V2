"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  planName: string;
  description: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  onSelectPlan: (planName: string) => void;
  disabled?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  planName,
  description,
  price,
  features,
  isPopular = false,
  buttonText,
  onSelectPlan,
  disabled = false,
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
        <CardTitle className="text-2xl font-bold">{planName}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
        <p className="text-4xl font-extrabold mt-4">
          {price}
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
          onClick={() => onSelectPlan(planName)}
          disabled={disabled}
          variant={isPopular ? "default" : "outline"}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlanCard;