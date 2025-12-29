"use client";

import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
  Trash2,
  Copy,
  Search,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Play,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  NewBudgetFormValues,
  BudgetItem,
} from "@/schemas/budget-schema";
import { Article } from "@/schemas/article-schema";
import { formatCurrency } from "@/utils/formatters";

import ArticleSelectDialog from "./ArticleSelectDialog";
import ArticleAutocompleteInput from "./ArticleAutocompleteInput";

interface BudgetServiceRowProps {
  form: UseFormReturn<NewBudgetFormValues>;
  isApproved: boolean;
  chapterIndex: number;
  itemIndex: number;
  articles: Article[];
  handleRemoveService: (
    chapterIndex: number,
    itemIndex: number
  ) => void;
  handleDuplicateService: (
    chapterIndex: number,
    itemIndex: number
  ) => void;
  focusRef: React.RefObject<HTMLInputElement>;
  userCompanyId: string | null;
}

const BudgetServiceRow: React.FC<
  BudgetServiceRowProps
> = ({
  form,
  isApproved,
  chapterIndex,
  itemIndex,
  articles,
  handleRemoveService,
  handleDuplicateService,
  focusRef,
  userCompanyId,
}) => {
  const item = useWatch({
    control: form.control,
    name: `chapters.${chapterIndex}.items.${itemIndex}`,
  });

  const [
    isArticleSelectDialogOpen,
    setIsArticleSelectDialogOpen,
  ] = React.useState(false);

  /* =========================
     HELPERS
  ========================= */

  const setField = (
    path: keyof BudgetItem,
    value: any
  ) =>
    form.setValue(
      `chapters.${chapterIndex}.items.${itemIndex}.${path}`,
      value,
      { shouldDirty: true }
    );

  const handleSelectArticle = (
    article: Article
  ) => {
    setField("servico", article.descricao);
    setField("unidade", article.unidade);
    setField(
      "preco_unitario",
      article.preco_unitario
    );
    setField("article_id", article.id);
  };

  const handleClearArticle = () => {
    setField("article_id", null);
    setField("servico", "");
    setField("unidade", "");
    setField("preco_unitario", 0);
  };

  const handleRemove = () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja remover este serviço?"
    );
    if (confirmed) {
      handleRemoveService(
        chapterIndex,
        itemIndex
      );
    }
  };

  const quantity =
    Number(item?.quantidade) || 0;
  const price =
    Number(item?.preco_unitario) || 0;

  const isQuantityInvalid = quantity <= 0;
  const isPriceInvalid = price <= 0;
  const isArticleSelected = !!item?.article_id;

  const renderStatusBadge = (
    status: BudgetItem["estado"]
  ) => {
    const map = {
      Planeado: {
        label: "Planeado",
        className:
          "border border-muted text-muted-foreground",
        tooltip: "Ainda não executado",
      },
      "Em andamento": {
        label: "Em andamento",
        className:
          "bg-blue-500 text-white",
        icon: (
          <Play className="h-3 w-3 mr-1" />
        ),
        tooltip: "Trabalho em progresso",
      },
      Concluído: {
        label: "Concluído",
        className:
          "bg-green-500 text-white",
        icon: (
          <CheckCircle className="h-3 w-3 mr-1" />
        ),
        tooltip: "Serviço concluído",
      },
      Atrasado: {
        label: "Atrasado",
        className:
          "bg-orange-500 text-white",
        icon: (
          <AlertTriangle className="h-3 w-3 mr-1" />
        ),
        tooltip: "Serviço com atraso",
      },
    } as const;

    const cfg = map[status];

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "w-fit",
              cfg.className
            )}
          >
            {cfg.icon}
            {cfg.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {cfg.tooltip}
        </TooltipContent>
      </Tooltip>
    );
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <TableRow>
      {/* SERVIÇO */}
      <TableCell className="py-2">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.servico`}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-1">
                <FormControl>
                  <ArticleAutocompleteInput
                    value={field.value}
                    onValueChange={
                      field.onChange
                    }
                    onSelectArticle={
                      handleSelectArticle
                    }
                    userCompanyId={
                      userCompanyId || ""
                    }
                    disabled={
                      isApproved ||
                      isArticleSelected
                    }
                    placeholder="Pesquisar ou digitar serviço..."
                  />
                </FormControl>

                {!isApproved && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={
                          isArticleSelected
                            ? "Limpar artigo"
                            : "Selecionar artigo"
                        }
                        onClick={() =>
                          isArticleSelected
                            ? handleClearArticle()
                            : setIsArticleSelectDialogOpen(
                                true
                              )
                        }
                      >
                        {isArticleSelected ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isArticleSelected
                        ? "Limpar artigo"
                        : "Selecionar artigo da base"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <ArticleSelectDialog
          isOpen={isArticleSelectDialogOpen}
          onClose={() =>
            setIsArticleSelectDialogOpen(false)
          }
          articles={articles}
          onSelectArticle={handleSelectArticle}
        />
      </TableCell>

      {/* QUANTIDADE */}
      <TableCell className="w-[100px]">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.quantidade`}
          render={({ field }) => (
            <FormItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      disabled={isApproved}
                      className={cn({
                        "border-orange-500":
                          isQuantityInvalid,
                      })}
                    />
                  </FormControl>
                </TooltipTrigger>
                {isQuantityInvalid && (
                  <TooltipContent>
                    Quantidade inválida
                  </TooltipContent>
                )}
              </Tooltip>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>

      {/* UNIDADE */}
      <TableCell className="w-[80px]">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.unidade`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  disabled={
                    isApproved ||
                    isArticleSelected
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      {/* PREÇO UNITÁRIO */}
      <TableCell className="w-[120px]">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`}
          render={({ field }) => (
            <FormItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      disabled={
                        isApproved ||
                        isArticleSelected
                      }
                      className={cn({
                        "border-orange-500":
                          isPriceInvalid,
                      })}
                    />
                  </FormControl>
                </TooltipTrigger>
                {isPriceInvalid && (
                  <TooltipContent>
                    Preço inválido
                  </TooltipContent>
                )}
              </Tooltip>
            </FormItem>
          )}
        />
      </TableCell>

      {/* CUSTO PLANEADO */}
      <TableCell className="text-right font-medium">
        {formatCurrency(
          item?.custo_planeado || 0
        )}
      </TableCell>

      {/* MATERIAL */}
      <TableCell className="w-[120px]">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.custo_real_material`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  disabled={isApproved}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      {/* MÃO DE OBRA */}
      <TableCell className="w-[120px]">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.custo_real_mao_obra`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  disabled={isApproved}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </TableCell>

      {/* EXECUTADO */}
      <TableCell className="text-right font-medium">
        {formatCurrency(
          item?.custo_executado || 0
        )}
      </TableCell>

      {/* ESTADO */}
      <TableCell>
        {renderStatusBadge(item?.estado)}
      </TableCell>

      {/* AÇÕES */}
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                disabled={isApproved}
                aria-label="Duplicar serviço"
                onClick={() =>
                  handleDuplicateService(
                    chapterIndex,
                    itemIndex
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Duplicar serviço
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                disabled={isApproved}
                aria-label="Remover serviço"
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Remover serviço
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BudgetServiceRow;
