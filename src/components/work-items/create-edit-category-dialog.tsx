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
import { useSession } from "@/components/SessionContextProvider"; // Import useSession
import { useNavigate } from "react-router-dom"; // Import useNavigate

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
  const navigate = useNavigate();
  const { profile } = useSession(); // Get profile from session

  const userPlanType = profile?.plan_type || 'trialing';
  const isInitiantePlan = userPlanType === 'iniciante' || userPlanType === 'trialing';

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
    // This check is also in CategoryManagementSection, but good to have here too
    if (isInitiantePlan && !categoryToEdit && (form.formState.isDirty || !data.id)) { // Check if creating new category
      toast.error("O seu plano 'Iniciante' permite um máximo de 10 categorias. Faça upgrade para criar mais.");
      navigate("/plans");
      return;
    }

    const newCategory: Category = {
      ...data,
      id: data.id || uuidv4(), // Generate ID if new category
    };
    onSave(newCategory);
    toast.success(`Categoria ${categoryToEdit ? "atualizada" : "criada"} com sucesso!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{categoryToEdit ? "Editar Categoria de Artigo" : "Criar Nova Categoria de Artigo"}</DialogTitle>
          <DialogDescription>
            Defina o nome e a descrição para esta categoria de artigos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria *</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-4">
              {categoryToEdit ? "Guardar Alterações" : "Criar Categoria"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditCategoryDialog;