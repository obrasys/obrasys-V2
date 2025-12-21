"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { NewBudgetFormValues } from "@/schemas/budget-schema";

interface BudgetValidationsProps {
  form: UseFormReturn<NewBudgetFormValues>;
  allValidationsComplete: boolean;
  hasEmptyServices: boolean;
  hasEmptyChapters: boolean;
}

const BudgetValidations: React.FC<BudgetValidationsProps> = ({
  form,
  allValidationsComplete,
  hasEmptyServices,
  hasEmptyChapters,
}) => {
  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" /> Validações Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Verificações automáticas para garantir a integridade do seu orçamento.
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li className={cn(form.formState.errors.nome ? "text-red-500" : "text-green-500")}>
            Nome do orçamento preenchido: {form.formState.errors.nome ? "❌" : "✅"}
          </li>
          <li className={cn(form.formState.errors.client_id ? "text-red-500" : "text-green-500")}>
            Cliente selecionado: {form.formState.errors.client_id ? "❌" : "✅"}
          </li>
          <li className={cn(form.formState.errors.localizacao ? "text-red-500" : "text-green-500")}>
            Localização da obra preenchida: {form.formState.errors.localizacao ? "❌" : "✅"}
          </li>
          <li className={cn(form.formState.errors.chapters ? "text-red-500" : "text-green-500")}>
            Pelo menos um capítulo: {form.formState.errors.chapters ? "❌" : "✅"}
          </li>
          <li className={cn(hasEmptyChapters ? "text-red-500" : "text-green-500")}>
            Nenhum capítulo vazio: {hasEmptyChapters ? "❌" : "✅"}
          </li>
          <li className={cn(hasEmptyServices ? "text-red-500" : "text-green-500")}>
            Todos os serviços com quantidade/preço válidos: {hasEmptyServices ? "❌" : "✅"}
          </li>
        </ul>
        <p className={cn("text-sm font-semibold mt-4", allValidationsComplete ? "text-green-600" : "text-orange-500")}>
          {allValidationsComplete
            ? "O orçamento está pronto para ser aprovado!"
            : "O orçamento pode ser aprovado quando todas as validações estiverem concluídas."}
        </p>
      </CardContent>
    </Card>
  );
};

export default BudgetValidations;