"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarDays, UserPlus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { NewBudgetFormValues } from "@/schemas/budget-schema";
import { Client } from "@/schemas/client-schema";

interface BudgetGeneralInfoProps {
  form: UseFormReturn<NewBudgetFormValues>;
  isApproved: boolean;
  clients: Client[];
  setIsClientDialogOpen: (isOpen: boolean) => void;
}

const BudgetGeneralInfo: React.FC<BudgetGeneralInfoProps> = ({
  form,
  isApproved,
  clients,
  setIsClientDialogOpen,
}) => {
  const currentBudgetState = form.watch("estado");

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Informações Gerais</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Orçamento *</FormLabel>
              <FormControl>
                <Input {...field} disabled={isApproved} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-end gap-2">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Cliente *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isApproved}>
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
          <Button type="button" variant="outline" size="icon" onClick={() => setIsClientDialogOpen(true)} disabled={isApproved}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        <FormField
          control={form.control}
          name="localizacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Obra / Localização *</FormLabel>
              <FormControl>
                <Input {...field} disabled={isApproved} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tipo_obra"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Obra *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isApproved}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de obra" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Nova construção">Nova construção</SelectItem>
                  <SelectItem value="Remodelação">Remodelação</SelectItem>
                  <SelectItem value="Ampliação">Ampliação</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="data_orcamento"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Orçamento *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isApproved}
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
          name="observacoes_gerais"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Observações Gerais (opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={isApproved} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem className="md:col-span-2">
          <FormLabel>Estado</FormLabel>
          <FormControl>
            <Input value={currentBudgetState} readOnly disabled className="capitalize" />
          </FormControl>
        </FormItem>
      </CardContent>
    </Card>
  );
};

export default BudgetGeneralInfo;