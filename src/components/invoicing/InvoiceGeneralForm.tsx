"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { format, parseISO, isValid } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarDays, Percent } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { FullInvoiceFormValues } from "@/components/invoicing/CreateEditInvoiceDialog";
import { Project } from "@/schemas/project-schema";
import { Client } from "@/schemas/client-schema";

interface InvoiceGeneralFormProps {
  form: UseFormReturn<FullInvoiceFormValues>;
  projects: Project[];
  clients: Client[];
}

const safeParseISO = (value?: string) => {
  if (!value) return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
};

const toISODate = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : "");

const InvoiceGeneralForm: React.FC<InvoiceGeneralFormProps> = ({
  form,
  projects,
  clients,
}) => {
  const issueDate = form.watch("issue_date");
  const dueDate = form.watch("due_date");

  const issue = safeParseISO(issueDate);
  const due = safeParseISO(dueDate);

  const datesInvalid =
    issue && due ? issue.getTime() > due.getTime() : false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* NÚMERO */}
      <FormField
        control={form.control}
        name="invoice_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número da Fatura *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Ex: FT 2025/001" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* IVA */}
      <FormField
        control={form.control}
        name="vat_rate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>IVA (%)</FormLabel>
            <FormControl>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={field.value ?? 23}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    field.onChange(Number.isFinite(v) ? v : 0);
                  }}
                  className="pl-9"
                  placeholder="23"
                />
              </div>
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1">
              Ex.: 23 (normal), 6 (reduzido), 0 (isento)
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* CLIENTE */}
      <FormField
        control={form.control}
        name="client_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente *</FormLabel>
            <Select
              value={field.value ?? ""}
              onValueChange={(v) => field.onChange(v || null)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* OBRA (OPCIONAL) */}
      <FormField
        control={form.control}
        name="project_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Obra (opcional)</FormLabel>
            <Select
              value={field.value ?? ""}
              onValueChange={(v) => field.onChange(v || null)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">Sem obra associada</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* DATA EMISSÃO */}
      <FormField
        control={form.control}
        name="issue_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data de Emissão *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !field.value && "text-muted-foreground",
                      datesInvalid && "border-red-500"
                    )}
                  >
                    {safeParseISO(field.value)
                      ? format(parseISO(field.value), "PPP", {
                          locale: pt,
                        })
                      : "Selecione uma data"}
                    <CalendarDays className="h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={safeParseISO(field.value)}
                  onSelect={(d) => field.onChange(toISODate(d))}
                  initialFocus
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
            {datesInvalid && (
              <p className="text-xs text-red-500">
                A data de emissão não pode ser posterior ao vencimento.
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* DATA VENCIMENTO */}
      <FormField
        control={form.control}
        name="due_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Data de Vencimento *</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !field.value && "text-muted-foreground",
                      datesInvalid && "border-red-500"
                    )}
                  >
                    {safeParseISO(field.value)
                      ? format(parseISO(field.value), "PPP", {
                          locale: pt,
                        })
                      : "Selecione uma data"}
                    <CalendarDays className="h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={safeParseISO(field.value)}
                  onSelect={(d) => field.onChange(toISODate(d))}
                  initialFocus
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
            {datesInvalid && (
              <p className="text-xs text-red-500">
                A data de vencimento deve ser igual ou posterior à emissão.
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* NOTAS */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Notas (opcional)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="Notas internas ou para o cliente..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default InvoiceGeneralForm;
