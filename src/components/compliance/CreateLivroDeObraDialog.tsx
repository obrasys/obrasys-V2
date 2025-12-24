"use client";

import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { LivroObra } from "@/schemas/compliance-schema";
import { Project } from "@/schemas/project-schema";

interface CreateLivroDeObraDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LivroObra) => void;
  projects: Project[];
  form: UseFormReturn<LivroObra>;
}

const CreateLivroDeObraDialog: React.FC<CreateLivroDeObraDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  form,
}) => {
  return (
    <Popover open={isOpen} onOpenChange={onClose}>
      <PopoverContent className="w-[400px] p-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl font-semibold">Criar Novo Livro de Obra</CardTitle>
          <p className="text-sm text-muted-foreground">Defina o período e a obra para o novo Livro de Obra.</p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Obra</FormLabel>
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
              name="periodo_inicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Início</FormLabel>
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
                            format(new Date(field.value), "PPP", { locale: pt })
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
              name="periodo_fim"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Fim</FormLabel>
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
                            format(new Date(field.value), "PPP", { locale: pt })
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
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Criar Livro de Obra</Button>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};

export default CreateLivroDeObraDialog;