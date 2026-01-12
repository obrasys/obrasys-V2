"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: React.ReactNode;
  description: string;
  icon: LucideIcon;
  iconColorClass?: string;
  extra?: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  iconColorClass = "text-blue-500",
  extra,
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 ease-in-out">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconColorClass)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {extra ? <div className="mt-2">{extra}</div> : null}
      </CardContent>
    </Card>
  );
};

export default KPICard;