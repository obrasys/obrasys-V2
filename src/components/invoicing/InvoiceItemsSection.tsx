"use client";

import React from "react";
import {
  UseFormReturn,
  FieldArrayWithId,
} from "react-hook-form";
import { PlusCircle, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

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

import { FullInvoiceFormValues } from "@/components/invoicing/CreateEditInvoiceDialog";
import { InvoiceItem } from "@/schemas/invoicing-schema";

interface InvoiceItemsSectionProps {
  form: UseFormReturn<FullInvoiceFormValues>;
  itemFields: FieldArrayWithId<
    FullInvoiceFormValues,
    "items",
    "id"
  >[];
  appendItem: (value: InvoiceItem) => void;
  removeItem: (index?: number | number[]) => void;
}

const toNumberSafe = (value: string) => {
  // Evita NaN quando o utilizador apaga o input
  const cleaned = value.replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const InvoiceItemsSection: React.FC<
  InvoiceItemsSectionProps
> = ({ form, itemFields, appendItem, removeItem }) => {
  const handleAddItem = () => {
    appendItem({
      id: uuidv4(),
      description: "",
      quantity: 1,
      unit: "un",
      unit_price: 0,
      line_total: 0,
      budget_item_id: null,
      schedule_task_id: null,
    });
  };

  const canRemove = itemFields.length > 1;

  return (
    <>
      <Separator className="my-4" />

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          Itens da Fatura
        </h3>

        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
          className="shrink-0"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      {itemFields.length === 0 && (
        <p className="text-muted-foreground text-sm mt-2">
          Nenhum item adicionado. Adicione um
          item para começar.
        </p>
      )}

      <div className="space-y-4 mt-3">
        {itemFields.map((item, index) => {
          const lineTotal =
            form.watch(`items.${index}.line_total`) ??
            0;

          return (
            <div
              key={item.id}
              className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end border p-3 rounded-md"
            >
              {/* DESCRIÇÃO */}
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Descrição *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Descrição do serviço/material"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* QUANTIDADE */}
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(e) =>
                          field.onChange(
                            toNumberSafe(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* UNIDADE */}
              <FormField
                control={form.control}
                name={`items.${index}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Un. *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="un, m², h"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PREÇO UNITÁRIO */}
              <FormField
                control={form.control}
                name={`items.${index}.unit_price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Unit. *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(e) =>
                          field.onChange(
                            toNumberSafe(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TOTAL LINHA */}
              <div className="flex flex-col">
                <FormLabel>Total</FormLabel>
                <Input
                  value={Number(lineTotal).toFixed(2)}
                  readOnly
                  disabled
                />
              </div>

              {/* REMOVER */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeItem(index)}
                className="self-end"
                disabled={!canRemove}
                aria-disabled={!canRemove}
                title={
                  canRemove
                    ? "Remover item"
                    : "A fatura deve ter pelo menos 1 item"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* CTA bottom (opcional) */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddItem}
        className="mt-4 w-full"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Adicionar Item
      </Button>
    </>
  );
};

export default InvoiceItemsSection;
