"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarDays } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { FullInvoiceFormValues } from "@/components/invoicing/CreateEditInvoiceDialog"; // Importar o tipo do componente pai
import { Project } from "@/schemas/project-schema";
import { Client } from "@/schemas/client-schema";

interface InvoiceGeneralFormProps {
  form: UseFormReturn<FullInvoiceFormValues>;
  projects: Project[];
  clients: Client[];
}

const InvoiceGeneralForm: React.FC<InvoiceGeneralFormProps> = ({
  form,
  projects,
  clients,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="invoice_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número da Fatura *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="client_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || "placeholder"}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="placeholder" disabled>Selecione um cliente</SelectItem>
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
      <FormField
        control={form.control}
        name="project_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Obra (opcional)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || "placeholder"}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="placeholder" disabled>Selecione uma obra</SelectItem>
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
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(parseISO(field.value), "PPP", { locale: pt })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                    <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? parseISO(field.value) : undefined}
                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                  initialFocus
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
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
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(parseISO(field.value), "PPP", { locale: pt })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                    <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? parseISO(field.value) : undefined}
                  onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                  initialFocus
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Notas (opcional)</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default InvoiceGeneralForm;