"use client";

import * as React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge"; // Importa o Badge original

const BadgeWithRef = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <Badge ref={ref} className={className} variant={variant} {...props} />
    );
  }
);
BadgeWithRef.displayName = "BadgeWithRef";

export { BadgeWithRef };