"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { NewBudgetFormValues } from "@/schemas/budget-schema";

interface UseBudgetCalculationsProps {
  form: UseFormReturn<NewBudgetFormValues>;
}

interface UseBudgetCalculationsResult {
  currentBudgetTotal: number;
  totalExecuted: number;
  calculateCosts: () => number;
}

export function useBudgetCalculations({ form }: UseBudgetCalculationsProps): UseBudgetCalculationsResult {
  const calculateCosts = React.useCallback(() => {
    const currentChapters = form.getValues("chapters");
    let totalPlanned = 0;
    let totalExecuted = 0;

    currentChapters.forEach((chapter, chapterIndex) => {
      chapter.items.forEach((item, itemIndex) => {
        const plannedCost = item.quantidade * item.preco_unitario;
        const executedCostItem = (item.custo_real_material || 0) + (item.custo_real_mao_obra || 0);
        const deviation = executedCostItem - plannedCost;

        // Update form values if there's a change
        if (form.getValues(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`) !== plannedCost) {
          form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`, plannedCost);
        }
        if (form.getValues(`chapters.${chapterIndex}.items.${itemIndex}.custo_executado`) !== executedCostItem) {
          form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.custo_executado`, executedCostItem);
        }
        if (form.getValues(`chapters.${chapterIndex}.items.${itemIndex}.desvio`) !== deviation) {
          form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.desvio`, deviation);
        }
        
        totalPlanned += plannedCost;
        totalExecuted += executedCostItem;
      });
    });
    return totalPlanned;
  }, [form]);

  const currentBudgetTotal = calculateCosts();
  const totalExecuted = form.watch("chapters").reduce((acc, chapter) => 
    acc + chapter.items.reduce((itemAcc, item) => itemAcc + ((item.custo_real_material || 0) + (item.custo_real_mao_obra || 0)), 0)
  , 0);

  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.includes("quantidade") || name?.includes("preco_unitario") || name?.includes("custo_real_material") || name?.includes("custo_real_mao_obra")) {
        calculateCosts();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calculateCosts]);

  return {
    currentBudgetTotal,
    totalExecuted,
    calculateCosts,
  };
}