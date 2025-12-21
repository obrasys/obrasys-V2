"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Trash2, Copy, Search, XCircle, AlertTriangle, CheckCircle, Play } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { NewBudgetFormValues, BudgetItem } from "@/schemas/budget-schema";
import { Article } from "@/schemas/article-schema";
import { formatCurrency } from "@/utils/formatters";
import ArticleSelectDialog from "./ArticleSelectDialog";
import { BadgeWithRef } from "@/components/ui/badge-with-ref"; // Importar BadgeWithRef

interface BudgetServiceRowProps {
  form: UseFormReturn<NewBudgetFormValues>;
  isApproved: boolean;
  chapterIndex: number;
  itemIndex: number;
  articles: Article[];
  handleRemoveService: (chapterIndex: number, itemIndex: number) => void;
  handleDuplicateService: (chapterIndex: number, itemIndex: number) => void;
  focusRef: React.RefObject<HTMLInputElement>;
}

const BudgetServiceRow: React.FC<BudgetServiceRowProps> = ({
  form,
  isApproved,
  chapterIndex,
  itemIndex,
  articles,
  handleRemoveService,
  handleDuplicateService,
  focusRef,
}) => {
  const item = form.watch(`chapters.${chapterIndex}.items.${itemIndex}`);
  const [isArticleSelectDialogOpen, setIsArticleSelectDialogOpen] = React.useState(false);

  const handleSelectArticle = (selectedArticle: Article) => {
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.servico`, selectedArticle.descricao);
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.unidade`, selectedArticle.unidade);
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`, selectedArticle.preco_unitario);
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.article_id`, selectedArticle.id);
    form.trigger(`chapters.${chapterIndex}.items.${itemIndex}.quantidade`);
  };

  const handleClearArticle = () => {
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.article_id`, null);
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.servico`, "");
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.unidade`, "");
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`, 0);
    form.trigger(`chapters.${chapterIndex}.items.${itemIndex}.quantidade`);
  };

  const isArticleSelected = !!item.article_id;
  const isQuantityInvalid = item.quantidade === 0 || isNaN(item.quantidade);
  const isPriceInvalid = item.preco_unitario === 0 || isNaN(item.preco_unitario);

  const getStatusBadge = (status: BudgetItem["estado"]) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    let colorClass = "";
    let tooltipText = "";
    let icon = null;

    switch (status) {
      case "Planeado":
        variant = "outline";
        colorClass = "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700";
        tooltipText = "Ainda não executado";
        break;
      case "Em andamento":
        variant = "default";
        colorClass = "bg-blue-500 hover:bg-blue-600 text-white";
        tooltipText = "Trabalho em progresso";
        icon = <Play className="h-3 w-3 mr-1" />;
        break;
      case "Concluído":
        variant = "default";
        colorClass = "bg-green-500 hover:bg-green-600 text-white";
        tooltipText = "Serviço concluído";
        icon = <CheckCircle className="h-3 w-3 mr-1" />;
        break;
      case "Atrasado":
        variant = "destructive";
        colorClass = "bg-orange-500 hover:bg-orange-600 text-white";
        tooltipText = "Serviço com atraso";
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        break;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <BadgeWithRef className={cn("w-fit", colorClass)} variant={variant}> {/* Usar BadgeWithRef aqui */}
            {icon} {status}
          </BadgeWithRef>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    );
  };

  const handleRemoveClick = () => {
    if (window.confirm("Tem certeza que deseja remover este serviço?")) {
      handleRemoveService(chapterIndex, itemIndex);
    }
  };

  return (
    <TableRow>
      <TableCell className="relative py-2">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.servico`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <div className="flex items-center gap-1">
                  <Input
                    {...field}
                    ref={itemIndex === 0 ? focusRef : null}
                    disabled={isApproved || isArticleSelected}
                    placeholder="Ex: Demolição manual de parede"
                    className="h-10 px-3 py-2"
                  />
                  {!isApproved && (
                    isArticleSelected ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" onClick={handleClearArticle} className="flex-shrink-0">
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Limpar artigo selecionado</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" onClick={() => setIsArticleSelectDialogOpen(true)} className="flex-shrink-0">
                            <Search className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Selecionar artigo da base de dados</TooltipContent>
                      </Tooltip>
                    )
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ArticleSelectDialog
          isOpen={isArticleSelectDialogOpen}
          onClose={() => setIsArticleSelectDialogOpen(false)}
          articles={articles}
          onSelectArticle={handleSelectArticle}
        />
      </TableCell>
      <TableCell className="w-[100px] py-2">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.quantidade`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      disabled={isApproved}
                      placeholder="Ex: 50"
                      className={cn("h-10 px-3 py-2", {
                        "border-orange-500 focus-visible:ring-orange-500": isQuantityInvalid,
                      })}
                    />
                  </FormControl>
                </TooltipTrigger>
                {isQuantityInvalid && <TooltipContent>Quantidade inválida</TooltipContent>}
              </Tooltip>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="w-[80px] py-2">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.unidade`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <Input
                  {...field}
                  disabled={isApproved || isArticleSelected}
                  placeholder="m², m³, un"
                  className="h-10 px-3 py-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="w-[120px] text-right py-2">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      disabled={isApproved || isArticleSelected}
                      placeholder="€"
                      className={cn("h-10 px-3 py-2", {
                        "border-orange-500 focus-visible:ring-orange-500": isPriceInvalid,
                      })}
                    />
                  </FormControl>
                </TooltipTrigger>
                {isPriceInvalid && <TooltipContent>Preço unitário em falta</TooltipContent>}
              </Tooltip>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="w-[120px] text-right font-medium py-2">
        {formatCurrency(item.custo_planeado)}
      </TableCell>
      <TableCell className="w-[100px] py-2">
        {getStatusBadge(item.estado)}
      </TableCell>
      <TableCell className="w-[100px] text-right py-2">
        <div className="flex justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={() => handleDuplicateService(chapterIndex, itemIndex)} disabled={isApproved}>
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicar serviço</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={handleRemoveClick} disabled={isApproved}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover serviço</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BudgetServiceRow;