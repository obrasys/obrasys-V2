"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Category, categorySchema } from "@/schemas/article-schema";
import { toast } from "sonner";

interface CreateEditCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  categoryToEdit?: Category | null;
}

const CreateEditCategoryDialog: React.FC<CreateEditCategoryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
}) => {
  const form = useForm<Category>({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryToEdit || {
      nome: "",
      descricao: "",
    },
  });

  React.useEffect(() => {
    if (categoryToEdit) {
      form.reset(categoryToEdit);
    } else {
      form.reset({
        nome: "",
        descricao: "",
      });
    }
  }, [categoryToEdit, form]);

  const onSubmit = (data: Category) => {
    const newCategory: Category = {
      ...data,
      id: data.id || uuidv4(), // Generate ID if new category
    };
    onSave(newCategory);
    toast.success(`Capítulo ${categoryToEdit ? "atualizado" : "criado"} com sucesso!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{categoryToEdit ? "Editar Capítulo" : "Criar Novo Capítulo"}</DialogTitle>
          <DialogDescription>
            Defina o nome e a descrição para este capítulo do catálogo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Capítulo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 01 – Trabalhos Preparatórios" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Breve descrição do capítulo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-4">
              {categoryToEdit ? "Guardar Alterações" : "Criar Capítulo"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditCategoryDialog;