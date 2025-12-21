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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Article, Category, Subcategory, articleSchema } from "@/schemas/article-schema";
import { toast } from "sonner";

interface CreateEditArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Article) => void;
  articleToEdit?: Article | null;
  categories: Category[];
  subcategories: Subcategory[];
}

const CreateEditArticleDialog: React.FC<CreateEditArticleDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  articleToEdit,
  categories,
  subcategories,
}) => {
  const form = useForm<Article>({
    resolver: zodResolver(articleSchema),
    defaultValues: articleToEdit || {
      codigo: "",
      descricao: "",
      unidade: "",
      categoria_id: "",
      subcategoria_id: "",
      tipo: "material",
      preco_unitario: 0,
      fonte_referencia: "",
      observacoes: "",
    },
  });

  React.useEffect(() => {
    if (articleToEdit) {
      form.reset(articleToEdit);
    } else {
      form.reset({
        codigo: "",
        descricao: "",
        unidade: "",
        categoria_id: "",
        subcategoria_id: "",
        tipo: "material",
        preco_unitario: 0,
        fonte_referencia: "",
        observacoes: "",
      });
    }
  }, [articleToEdit, form]);

  const onSubmit = (data: Article) => {
    const newArticle: Article = {
      ...data,
      id: data.id || uuidv4(), // Generate ID if new article
    };
    onSave(newArticle);
    toast.success(`Artigo ${articleToEdit ? "atualizado" : "criado"} com sucesso!`);
    onClose();
  };

  const selectedCategoryId = form.watch("categoria_id");
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoria_id === selectedCategoryId,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{articleToEdit ? "Editar Artigo" : "Criar Novo Artigo"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do artigo de construção.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="servico">Serviço</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="equipe">Equipa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nome}
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
                name="subcategoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategoryId || filteredSubcategories.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma subcategoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preco_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Unitário</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fonte_referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte de Referência</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="mt-4">
              {articleToEdit ? "Guardar Alterações" : "Criar Artigo"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditArticleDialog;