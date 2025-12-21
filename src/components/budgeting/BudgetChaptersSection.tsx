"use client";

import React from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { PlusCircle, ClipboardList } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";

import { NewBudgetFormValues, BudgetItem } from "@/schemas/budget-schema"; // Removido BudgetChapterForm daqui
import BudgetChapterForm from "./BudgetChapterForm"; // <-- Importação correta do componente
import { Article } from "@/schemas/article-schema"; // Import Article type
import { v4 as uuidv4 } from "uuid";

interface BudgetChaptersSectionProps {
  form: UseFormReturn<NewBudgetFormValues>;
  isApproved: boolean;
  articles: Article[]; // NOVO: Passar artigos para os capítulos
  calculateCosts: () => number;
}

const BudgetChaptersSection: React.FC<BudgetChaptersSectionProps> = ({
  form,
  isApproved,
  articles, // NOVO: Receber artigos
  calculateCosts,
}) => {
  const { fields: chapterFields, append: appendChapter, remove: removeChapter, move: moveChapter } = useFieldArray({
    control: form.control,
    name: "chapters",
  });

  const handleAddChapter = () => {
    const newChapterCode = String(chapterFields.length + 1).padStart(2, '0');
    appendChapter({
      id: uuidv4(),
      codigo: newChapterCode,
      nome: `Novo Capítulo ${newChapterCode}`,
      observacoes: "",
      items: [
        {
          id: uuidv4(),
          capitulo_id: "", // Will be set dynamically
          capitulo: `Capítulo ${newChapterCode}`, // Adicionado para corresponder ao esquema
          servico: "Novo Serviço",
          quantidade: 1,
          unidade: "un",
          preco_unitario: 0,
          custo_planeado: 0,
          custo_executado: 0,
          desvio: 0,
          estado: "Planeado",
          article_id: null, // NOVO: Default para null
        },
      ],
    });
  };

  const handleAddService = (chapterIndex: number) => {
    const chapterId = chapterFields[chapterIndex].id;
    const chapterName = form.getValues(`chapters.${chapterIndex}.nome`); // Obter o nome do capítulo
    const newService: BudgetItem = {
      id: uuidv4(),
      capitulo_id: chapterId,
      capitulo: chapterName, // Usar o nome do capítulo
      servico: "Novo Serviço",
      quantidade: 1,
      unidade: "un",
      preco_unitario: 0,
      custo_planeado: 0,
      custo_executado: 0,
      desvio: 0,
      estado: "Planeado",
      article_id: null, // NOVO: Default para null
    };
    const currentItems = form.getValues(`chapters.${chapterIndex}.items`);
    form.setValue(`chapters.${chapterIndex}.items`, [...currentItems, newService]);
    calculateCosts();
  };

  const handleRemoveService = (chapterIndex: number, itemIndex: number) => {
    const currentItems = form.getValues(`chapters.${chapterIndex}.items`);
    const updatedItems = currentItems.filter((_, idx) => idx !== itemIndex);
    form.setValue(`chapters.${chapterIndex}.items`, updatedItems);
    calculateCosts();
  };

  const handleDuplicateService = (chapterIndex: number, itemIndex: number) => {
    const serviceToDuplicate = form.getValues(`chapters.${chapterIndex}.items.${itemIndex}`);
    const duplicatedService = { ...serviceToDuplicate, id: uuidv4() };
    const currentItems = form.getValues(`chapters.${chapterIndex}.items`);
    const updatedItems = [...currentItems, duplicatedService];
    form.setValue(`chapters.${chapterIndex}.items`, updatedItems);
    calculateCosts();
  };

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Capítulos e Serviços</CardTitle>
        <Button type="button" onClick={handleAddChapter} disabled={isApproved}>
          <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Capítulo
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
        <Accordion type="multiple" className="w-full">
          {chapterFields.map((chapter, chapterIndex) => (
            <BudgetChapterForm
              key={chapter.id}
              form={form}
              isApproved={isApproved}
              chapterIndex={chapterIndex}
              chapterId={chapter.id}
              chapterFieldsLength={chapterFields.length}
              articles={articles} // NOVO: Passar artigos
              handleAddService={handleAddService}
              handleRemoveService={handleRemoveService}
              handleDuplicateService={handleDuplicateService}
              removeChapter={removeChapter}
              moveChapter={moveChapter}
            />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default BudgetChaptersSection;