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
  hasEmptyServices: boolean; // Agora representa 'hasMissingServiceDetails'
  hasEmptyChapters: boolean; // Agora representa 'hasEmptyChapters || hasMissingChapterDetails'
  hasMissingChapterDetails: boolean; // NOVO: Para código/nome do capítulo
  hasMissingServiceDetails: boolean; // NOVO: Para unidade/capítulo do item
}

const BudgetValidations: React.FC<BudgetValidationsProps> = ({
  form,
  allValidationsComplete,
  hasEmptyServices, // Renomeado para clareza na descrição
  hasEmptyChapters, // Renomeado para clareza na descrição
  hasMissingChapterDetails, // NOVO
  hasMissingServiceDetails, // NOVO
}) => {
  const chapters = form.watch("chapters");
  const hasAtLeastOneChapter = chapters && chapters.length > 0;

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
          <li className={cn(!hasAtLeastOneChapter ? "text-red-500" : "text-green-500")}>
            Pelo menos um capítulo: {!hasAtLeastOneChapter ? "❌" : "✅"}
          </li>
          <li className={cn(hasMissingChapterDetails ? "text-red-500" : "text-green-500")}>
            Todos os capítulos com código e nome preenchidos: {hasMissingChapterDetails ? "❌" : "✅"}
          </li>
          <li className={cn(hasEmptyChapters ? "text-red-500" : "text-green-500")}>
            Nenhum capítulo vazio (com pelo menos um serviço): {hasEmptyChapters ? "❌" : "✅"}
          </li>
          <li className={cn(hasMissingServiceDetails ? "text-red-500" : "text-green-500")}>
            Todos os serviços com descrição, quantidade, unidade e preço válidos: {hasMissingServiceDetails ? "❌" : "✅"}
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