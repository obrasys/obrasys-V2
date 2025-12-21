"use client";

import React from "react";
import { Check, HardHat } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const BudgetApprovalSection: React.FC<BudgetApprovalSectionProps> = ({
  isApproved,
  handleApproveBudget,
  isSaving,
  allValidationsComplete,
  approvedBudgetId,
  setIsProjectDialogOpen,
}) => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Aprovação do Orçamento</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!isApproved ? (
          <Button
            type="button"
            onClick={handleApproveBudget}
            disabled={!allValidationsComplete || isSaving}
            className="w-full flex items-center gap-2"
          >
            <Check className="h-4 w-4" /> Aprovar Orçamento
          </Button>
        ) : (
          <>
            <Badge className="w-fit text-lg px-4 py-2 bg-green-500 text-white">Orçamento Aprovado</Badge>
            <p className="text-sm text-muted-foreground">
              Este orçamento foi aprovado e está bloqueado para edição. Agora pode criar uma obra associada.
            </p>
            <Button
              type="button"
              onClick={() => setIsProjectDialogOpen(true)}
              disabled={!approvedBudgetId}
              className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <HardHat className="h-4 w-4" /> Criar Obra a partir deste Orçamento
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetApprovalSection;