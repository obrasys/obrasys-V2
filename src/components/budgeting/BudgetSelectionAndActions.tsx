"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Check, HardHat, Trash2, Calculator } from "lucide-react";
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

const BudgetSelectionAndActions: React.FC<BudgetSelectionAndActionsProps> = ({
  budgets,
  selectedBudgetId,
  setSelectedBudgetId,
  handleApproveBudget,
  handleDeleteBudget,
  setIsProjectDialogOpen,
}) => {
  const navigate = useNavigate();
  const selectedBudget = React.useMemo(() => budgets.find(b => b.id === selectedBudgetId), [budgets, selectedBudgetId]);

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Gerir Orçamentos</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedBudgetId || ""}
            onValueChange={(budgetId) => setSelectedBudgetId(budgetId)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecione um Orçamento">
                {selectedBudget ? selectedBudget.nome : "Selecione um Orçamento"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  {budget.nome} ({budget.estado})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedBudget && selectedBudget.estado === "Rascunho" && (
            <>
              <Button onClick={() => navigate(`/budgeting/edit/${selectedBudget.id}`)} variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" /> Editar Orçamento
              </Button>
              <Button onClick={() => handleApproveBudget(selectedBudget.id)} className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Aprovar Orçamento
              </Button>
            </>
          )}
          {selectedBudget && selectedBudget.estado === "Aprovado" && !selectedBudget.project_id && (
            <Button onClick={() => setIsProjectDialogOpen(true)} className="flex items-center gap-2">
              <HardHat className="h-4 w-4" /> Criar Obra
            </Button>
          )}
          {selectedBudget && selectedBudget.project_id && (
            <Button variant="outline" disabled className="flex items-center gap-2">
              <HardHat className="h-4 w-4" /> Obra Associada
            </Button>
          )}
          {selectedBudget && (
            <Button variant="destructive" onClick={() => handleDeleteBudget(selectedBudget.id)} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Eliminar Orçamento
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedBudget ? (
          <p className="text-sm text-muted-foreground">
            Orçamento selecionado: <span className="font-medium">{selectedBudget.nome}</span> - Estado: <span className="font-medium">{selectedBudget.estado}</span>
          </p>
        ) : (
          <EmptyState
            icon={Calculator}
            title="Nenhum orçamento selecionado"
            description="Selecione um orçamento para ver os detalhes ou crie um novo."
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetSelectionAndActions;