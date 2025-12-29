"use client";

import React from "react";
import { Check, HardHat } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BudgetApprovalSectionProps {
  isApproved: boolean;
  handleApproveBudget: () => void;
  isSaving: boolean;
  allValidationsComplete: boolean;
  approvedBudgetId: string | null;
  setIsProjectDialogOpen: (isOpen: boolean) => void;
}

const BudgetApprovalSection: React.FC<
  BudgetApprovalSectionProps
> = ({
  isApproved,
  handleApproveBudget,
  isSaving,
  allValidationsComplete,
  approvedBudgetId,
  setIsProjectDialogOpen,
}) => {
  const isApproveDisabled =
    !allValidationsComplete || isSaving;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl tracking-tight">
          Aprovação do Orçamento
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!isApproved ? (
          <>
            <Button
              type="button"
              onClick={handleApproveBudget}
              disabled={isApproveDisabled}
              aria-disabled={isApproveDisabled}
              aria-busy={isSaving}
              className="w-full flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isSaving
                ? "A aprovar orçamento..."
                : "Aprovar Orçamento"}
            </Button>

            {!allValidationsComplete && (
              <p className="text-sm text-muted-foreground">
                Complete todas as validações antes de aprovar
                o orçamento.
              </p>
            )}
          </>
        ) : (
          <>
            <Badge
              variant="default"
              className="w-fit text-base px-4 py-2 bg-green-600 text-white"
            >
              Orçamento Aprovado
            </Badge>

            <p className="text-sm text-muted-foreground">
              Este orçamento foi aprovado e está bloqueado para
              edição. Agora pode criar uma obra associada.
            </p>

            <Button
              type="button"
              variant="default"
              onClick={() => setIsProjectDialogOpen(true)}
              disabled={!approvedBudgetId}
              aria-disabled={!approvedBudgetId}
              className="w-full flex items-center justify-center gap-2"
            >
              <HardHat className="h-4 w-4" />
              Criar Obra a partir deste Orçamento
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetApprovalSection;
