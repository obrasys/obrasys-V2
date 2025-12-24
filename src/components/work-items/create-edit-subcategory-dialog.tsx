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
import { Subcategory, subcategorySchema } from "@/schemas/article-schema";
import { toast } from "sonner";

interface CreateEditSubcategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subcategory: Subcategory) => void;
  subcategoryToEdit?: Subcategory | null;
  categoryId: string | null; // The parent category ID
}

const CreateEditSubcategoryDialog: React.FC<CreateEditSubcategoryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  subcategoryToEdit,
  categoryId,
}) => {
  const form = useForm<Subcategory>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: subcategoryToEdit || {
      nome: "",
      descricao: "",
      categoria_id: categoryId || "", // Pre-fill category_id
    },
  });

  React.useEffect(() => {
    if (subcategoryToEdit) {
      form.reset(subcategoryToEdit);
    } else {
      form.reset({
        nome: "",
        descricao: "",
        categoria_id: categoryId || "",
      });
    }
  }, [subcategoryToEdit, categoryId, form]);

  const onSubmit = (data: Subcategory) => {
    if (!categoryId) {
      toast.error("ID da categoria pai em falta.");
      return;
    }
    const newSubcategory: Subcategory = {
      ...data,
      id: data.id || uuidv4(), // Generate ID if new subcategory
      categoria_id: categoryId, // Ensure correct parent category
    };
    onSave(newSubcategory);
    toast.success(`Subcategoria ${subcategoryToEdit ? "atualizada" : "criada"} com sucesso!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{subcategoryToEdit ? "Editar Subcategoria de Artigo" : "Criar Nova Subcategoria de Artigo"}</DialogTitle>
          <DialogDescription>
            Defina o nome e a descrição para esta subcategoria de artigos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Subcategoria *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Escavação em Terra" {...field} />
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
                    <Textarea placeholder="Breve descrição da subcategoria..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-4">
              {subcategoryToEdit ? "Guardar Alterações" : "Criar Subcategoria"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditSubcategoryDialog;