"use client";

import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { NewBudgetFormValues } from "@/schemas/budget-schema";

interface BudgetValidationsProps {
  form: UseFormReturn<NewBudgetFormValues>;
  allValidationsComplete: boolean;
  hasEmptyServices: boolean; // legado (mantido por compatibilidade)
  hasEmptyChapters: boolean;
  hasMissingChapterDetails: boolean;
  hasMissingServiceDetails: boolean;
}

/* =========================
   HELPERS
========================= */

interface ValidationItemProps {
  label: string;
  isValid: boolean;
}

const ValidationItem: React.FC<
  ValidationItemProps
> = ({ label, isValid }) => {
  const Icon = isValid
    ? CheckCircle
    : XCircle;

  return (
    <li
      className={cn(
        "flex items-center gap-2",
        isValid
          ? "text-green-600"
          : "text-red-500"
      )}
    >
      <Icon
        className="h-4 w-4"
        aria-hidden="true"
      />
      <span>{label}</span>
    </li>
  );
};

const BudgetValidations: React.FC<
  BudgetValidationsProps
> = ({
  form,
  allValidationsComplete,
  hasEmptyChapters,
  hasMissingChapterDetails,
  hasMissingServiceDetails,
}) => {
  const chapters = useWatch({
    control: form.control,
    name: "chapters",
  });

  const hasAtLeastOneChapter =
    Array.isArray(chapters) &&
    chapters.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl tracking-tight">
          <AlertTriangle
            className="h-5 w-5 text-primary"
            aria-hidden="true"
          />
          Validações Inteligentes
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Verificações automáticas para garantir
          a integridade do orçamento antes da
          aprovação.
        </p>

        <ul className="space-y-2 text-sm">
          <ValidationItem
            label="Nome do orçamento preenchido"
            isValid={!form.formState.errors.nome}
          />

          <ValidationItem
            label="Cliente selecionado"
            isValid={
              !form.formState.errors.client_id
            }
          />

          <ValidationItem
            label="Localização da obra preenchida"
            isValid={
              !form.formState.errors.localizacao
            }
          />

          <ValidationItem
            label="Existe pelo menos um capítulo"
            isValid={hasAtLeastOneChapter}
          />

          <ValidationItem
            label="Todos os capítulos têm código e nome"
            isValid={!hasMissingChapterDetails}
          />

          <ValidationItem
            label="Nenhum capítulo está vazio"
            isValid={!hasEmptyChapters}
          />

          <ValidationItem
            label="Todos os serviços têm descrição, quantidade, unidade e preço válidos"
            isValid={!hasMissingServiceDetails}
          />
        </ul>

        <div
          className={cn(
            "mt-4 text-sm font-semibold",
            allValidationsComplete
              ? "text-green-600"
              : "text-orange-500"
          )}
        >
          {allValidationsComplete
            ? "O orçamento está pronto para aprovação."
            : "Conclua todas as validações para aprovar o orçamento."}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetValidations;
