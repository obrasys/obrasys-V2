"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Check,
  HardHat,
  Trash2,
  Calculator,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { BudgetWithRelations } from "@/schemas/budget-schema";
import { useNavigate } from "react-router-dom";

interface BudgetSelectionAndActionsProps {
  budgets: BudgetWithRelations[];
  selectedBudgetId: string | null;
  setSelectedBudgetId: (id: string | null) => void;
  handleApproveBudget: (budgetId: string) => Promise<void>;
  handleDeleteBudget: (budgetId: string) => Promise<void>;
  setIsProjectDialogOpen: (isOpen: boolean) => void;
}

const BudgetSelectionAndActions: React.FC<
  BudgetSelectionAndActionsProps
> = ({
  budgets,
  selectedBudgetId,
  setSelectedBudgetId,
  handleApproveBudget,
  handleDeleteBudget,
  setIsProjectDialogOpen,
}) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] =
    useState(false);

  const selectedBudget = useMemo(
    () =>
      budgets.find(
        (b) => b.id === selectedBudgetId
      ),
    [budgets, selectedBudgetId]
  );

  const handleApprove = async () => {
    if (!selectedBudget) return;
    try {
      setIsProcessing(true);
      await handleApproveBudget(
        selectedBudget.id
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBudget) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja eliminar este orçamento? Esta ação não pode ser desfeita."
    );
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      await handleDeleteBudget(
        selectedBudget.id
      );
      setSelectedBudgetId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle className="text-xl tracking-tight">
          Gerir Orçamentos
        </CardTitle>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedBudgetId ?? ""}
            onValueChange={(id) =>
              setSelectedBudgetId(id)
            }
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Selecione um orçamento" />
            </SelectTrigger>

            <SelectContent>
              {budgets.map((budget) => (
                <SelectItem
                  key={budget.id}
                  value={budget.id}
                >
                  {budget.nome}{" "}
                  <span className="text-muted-foreground">
                    ({budget.estado})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* AÇÕES */}
          {selectedBudget?.estado ===
            "Rascunho" && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/budgeting/edit/${selectedBudget.id}`
                  )
                }
                aria-label="Editar orçamento"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>

              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                aria-disabled={isProcessing}
                aria-label="Aprovar orçamento"
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Aprovar
              </Button>
            </>
          )}

          {selectedBudget?.estado ===
            "Aprovado" &&
            !selectedBudget.project_id && (
              <Button
                onClick={() =>
                  setIsProjectDialogOpen(true)
                }
                aria-label="Criar obra"
                className="flex items-center gap-2"
              >
                <HardHat className="h-4 w-4" />
                Criar Obra
              </Button>
            )}

          {selectedBudget?.project_id && (
            <Button
              variant="outline"
              disabled
              aria-disabled="true"
              className="flex items-center gap-2"
            >
              <HardHat className="h-4 w-4" />
              Obra Associada
            </Button>
          )}

          {selectedBudget && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isProcessing}
              aria-disabled={isProcessing}
              aria-label="Eliminar orçamento"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {selectedBudget ? (
          <p className="text-sm text-muted-foreground">
            Orçamento selecionado:{" "}
            <span className="font-medium">
              {selectedBudget.nome}
            </span>{" "}
            · Estado:{" "}
            <span className="font-medium capitalize">
              {selectedBudget.estado}
            </span>
          </p>
        ) : (
          <EmptyState
            icon={Calculator}
            title="Nenhum orçamento selecionado"
            description="Selecione um orçamento para gerir ou crie um novo."
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetSelectionAndActions;
