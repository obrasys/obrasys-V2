import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Trash2, Copy, Search, XCircle } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { NewBudgetFormValues, BudgetItem } from "@/schemas/budget-schema";
import { Article } from "@/schemas/article-schema"; // Import Article type
import { formatCurrency } from "@/utils/formatters";
import ArticleSelectDialog from "./ArticleSelectDialog"; // Import the new dialog

interface BudgetServiceRowProps {
  form: UseFormReturn<NewBudgetFormValues>;
  isApproved: boolean;
  chapterIndex: number;
  itemIndex: number;
  articles: Article[]; // Pass articles down
  handleRemoveService: (chapterIndex: number, itemIndex: number) => void;
  handleDuplicateService: (chapterIndex: number, itemIndex: number) => void;
}

const BudgetServiceRow: React.FC<BudgetServiceRowProps> = ({
  form,
  isApproved,
  chapterIndex,
  itemIndex,
  articles,
  handleRemoveService,
  handleDuplicateService,
}) => {
  const item = form.watch(`chapters.${chapterIndex}.items.${itemIndex}`);
  const [isArticleSelectDialogOpen, setIsArticleSelectDialogOpen] = React.useState(false);

  const handleSelectArticle = (selectedArticle: Article) => {
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.servico`, selectedArticle.descricao);
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.unidade`, selectedArticle.unidade);
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`, selectedArticle.preco_unitario);
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.article_id`, selectedArticle.id);
    // Trigger recalculation of costs
    form.trigger(`chapters.${chapterIndex}.items.${itemIndex}.quantidade`);
  };

  const handleClearArticle = () => {
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.article_id`, null);
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.servico`, "");
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.unidade`, "");
    form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`, 0);
    // Trigger recalculation of costs
    form.trigger(`chapters.${chapterIndex}.items.${itemIndex}.quantidade`);
  };

  const isArticleSelected = !!item.article_id;

  return (
    <TableRow>
      <TableCell className="relative">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.servico`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <div className="flex items-center gap-1">
                  <Input {...field} disabled={isApproved || isArticleSelected} />
                  {!isApproved && (
                    isArticleSelected ? (
                      <Button type="button" variant="ghost" size="icon" onClick={handleClearArticle} className="flex-shrink-0">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    ) : (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsArticleSelectDialogOpen(true)} className="flex-shrink-0">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </Button>
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
      <TableCell className="w-[100px]">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.quantidade`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <Input type="number" step="0.01" {...field} disabled={isApproved} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="w-[80px]">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.unidade`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <Input {...field} disabled={isApproved || isArticleSelected} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="w-[120px] text-right">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <Input type="number" step="0.01" {...field} disabled={isApproved || isArticleSelected} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="w-[120px] text-right font-medium">
        {formatCurrency(item.custo_planeado)}
      </TableCell>
      <TableCell className="w-[100px]">
        <Badge variant="secondary">{item.estado}</Badge>
      </TableCell>
      <TableCell className="w-[100px] text-right">
        <div className="flex justify-end gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => handleDuplicateService(chapterIndex, itemIndex)} disabled={isApproved}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveService(chapterIndex, itemIndex)} disabled={isApproved}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BudgetServiceRow;