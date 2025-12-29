"use client";

import React from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { PlusCircle, ClipboardList } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";

import {
  NewBudgetFormValues,
  BudgetItem,
} from "@/schemas/budget-schema";
import BudgetChapterForm from "./BudgetChapterForm";
import { Article } from "@/schemas/article-schema";
import { v4 as uuidv4 } from "uuid";

interface BudgetChaptersSectionProps {
  form: UseFormReturn<NewBudgetFormValues>;
  isApproved: boolean;
  articles: Article[];
  calculateCosts: () => number;
  userCompanyId: string | null;
}

const BudgetChaptersSection: React.FC<
  BudgetChaptersSectionProps
> = ({
  form,
  isApproved,
  articles,
  calculateCosts,
  userCompanyId,
}) => {
  const {
    fields: chapterFields,
    append: appendChapter,
    remove: removeChapter,
    move: moveChapter,
  } = useFieldArray({
    control: form.control,
    name: "chapters",
  });

  /* =========================
     HANDLERS
  ========================= */

  const handleAddChapter = () => {
    const newChapterIndex = chapterFields.length + 1;
    const newChapterCode = String(
      newChapterIndex
    ).padStart(2, "0");

    appendChapter({
      id: uuidv4(),
      codigo: newChapterCode,
      nome: `Novo Capítulo ${newChapterCode}`,
      observacoes: "",
      items: [],
    });
  };

  const handleAddService = (chapterIndex: number) => {
    const chapterName = form.getValues(
      `chapters.${chapterIndex}.nome`
    );

    const newService: BudgetItem = {
      id: uuidv4(),
      capitulo_id: null,
      capitulo: chapterName,
      servico: "Novo Serviço",
      quantidade: 1,
      unidade: "un",
      preco_unitario: 0.01,
      custo_planeado: 0,
      custo_executado: 0,
      custo_real_material: 0,
      custo_real_mao_obra: 0,
      desvio: 0,
      estado: "Planeado",
      article_id: null,
    };

    const currentItems =
      form.getValues(
        `chapters.${chapterIndex}.items`
      ) ?? [];

    form.setValue(
      `chapters.${chapterIndex}.items`,
      [...currentItems, newService],
      { shouldDirty: true }
    );

    calculateCosts();
  };

  const handleRemoveService = (
    chapterIndex: number,
    itemIndex: number
  ) => {
    const currentItems =
      form.getValues(
        `chapters.${chapterIndex}.items`
      ) ?? [];

    form.setValue(
      `chapters.${chapterIndex}.items`,
      currentItems.filter(
        (_, idx) => idx !== itemIndex
      ),
      { shouldDirty: true }
    );

    calculateCosts();
  };

  const handleDuplicateService = (
    chapterIndex: number,
    itemIndex: number
  ) => {
    const currentItems =
      form.getValues(
        `chapters.${chapterIndex}.items`
      ) ?? [];

    const serviceToDuplicate =
      currentItems[itemIndex];

    if (!serviceToDuplicate) return;

    const duplicatedService: BudgetItem = {
      ...serviceToDuplicate,
      id: uuidv4(),
    };

    form.setValue(
      `chapters.${chapterIndex}.items`,
      [...currentItems, duplicatedService],
      { shouldDirty: true }
    );

    calculateCosts();
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl tracking-tight">
          Capítulos e Serviços
        </CardTitle>

        <Button
          type="button"
          onClick={handleAddChapter}
          disabled={isApproved}
          aria-disabled={isApproved}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Capítulo
        </Button>
      </CardHeader>

      <CardContent>
        {chapterFields.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum capítulo adicionado"
            description="Adicione capítulos para estruturar o seu orçamento."
            buttonText="Adicionar Primeiro Capítulo"
            onButtonClick={handleAddChapter}
          />
        )}

        {chapterFields.length > 0 && (
          <Accordion
            type="multiple"
            className="w-full"
          >
            {chapterFields.map(
              (chapter, chapterIndex) => (
                <BudgetChapterForm
                  key={chapter.id}
                  form={form}
                  isApproved={isApproved}
                  chapterIndex={chapterIndex}
                  chapterId={chapter.id}
                  chapterFieldsLength={
                    chapterFields.length
                  }
                  articles={articles}
                  handleAddService={
                    handleAddService
                  }
                  handleRemoveService={
                    handleRemoveService
                  }
                  handleDuplicateService={
                    handleDuplicateService
                  }
                  removeChapter={removeChapter}
                  moveChapter={moveChapter}
                  userCompanyId={userCompanyId}
                />
              )
            )}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetChaptersSection;
