import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Trash2, Copy } from "lucide-react";

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

import { NewBudgetFormValues } from "@/schemas/budget-schema";
import { formatCurrency } from "@/utils/formatters";

interface BudgetServiceRowProps {
  form: UseFormReturn<NewBudgetFormValues>;
  isApproved: boolean;
  chapterIndex: number;
  itemIndex: number;
  handleRemoveService: (chapterIndex: number, itemIndex: number) => void;
  handleDuplicateService: (chapterIndex: number, itemIndex: number) => void;
}

const BudgetServiceRow: React.FC<BudgetServiceRowProps> = ({
  form,
  isApproved,
  chapterIndex,
  itemIndex,
  handleRemoveService,
  handleDuplicateService,
}) => {
  const item = form.watch(`chapters.${chapterIndex}.items.${itemIndex}`);

  return (
    <TableRow>
      <TableCell>
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.servico`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <Input {...field} disabled={isApproved} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell>
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
      <TableCell>
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.unidade`}
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <Input {...field} disabled={isApproved} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </TableCell>
      <TableCell className="text-right">
        <FormField
          control={form.control}
          name={`chapters.${chapterIndex}.items.${itemIndex}.preco_unitario`}
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
      <TableCell className="text-right font-medium">
        {formatCurrency(item.custo_planeado)}
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{item.estado}</Badge>
      </TableCell>
      <TableCell className="text-right">
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