"use client";

import React from "react";
import { UseFormReturn, useFieldArray, FieldArrayWithId } from "react-hook-form";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { FullInvoiceFormValues } from "@/components/invoicing/CreateEditInvoiceDialog"; // Importar o tipo do componente pai
import { InvoiceItem } from "@/schemas/invoicing-schema";

interface InvoiceItemsSectionProps {
  form: UseFormReturn<FullInvoiceFormValues>;
  itemFields: FieldArrayWithId<FullInvoiceFormValues, "items", "id">[];
  appendItem: (value: InvoiceItem) => void;
  removeItem: (index?: number | number[]) => void;
}

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  form,
  itemFields,
  appendItem,
  removeItem,
}) => {
  const handleAddItem = () => {
    appendItem({
      id: Math.random().toString(), // Temporary ID for new items in form
      description: "",
      quantity: 1,
      unit: "un",
      unit_price: 0,
      line_total: 0,
      budget_item_id: null,
      schedule_task_id: null,
    });
  };

  return (
    <>
      <Separator className="my-4" />

      <h3 className="text-lg font-semibold mb-2">Itens da Fatura</h3>
      {itemFields.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhum item adicionado. Adicione um item para começar.</p>
      )}
      <div className="space-y-4">
        {itemFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end border p-3 rounded-md">
            <FormField
              control={form.control}
              name={`items.${index}.description`}
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descrição do serviço/material" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`items.${index}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qtd. *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`items.${index}.unit`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Un. *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="un, m², h" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`items.${index}.unit_price`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Unit. *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col">
              <FormLabel>Total</FormLabel>
              <Input value={(form.watch(`items.${index}.line_total`) || 0).toFixed(2)} readOnly disabled />
            </div>
            <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)} className="self-end">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={handleAddItem} className="mt-4 w-full">
        <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Item
      </Button>
    </>
  );
};

export default InvoiceItemsSection;