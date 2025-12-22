"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, FolderOpen } from "lucide-react";
import { Category } from "@/schemas/article-schema";
import EmptyState from "@/components/EmptyState";
import CreateEditCategoryDialog from "./create-edit-category-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CategoryManagementSectionProps {
  categories: Category[];
  userCompanyId: string | null;
  onCategoriesUpdated: () => void; // Callback to refresh categories in parent
}

const CategoryManagementSection: React.FC<CategoryManagementSectionProps> = ({
  categories,
  userCompanyId,
  onCategoriesUpdated,
}) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [categoryToEdit, setCategoryToEdit] = React.useState<Category | null>(null);

  const handleSaveCategory = async (category: Category) => {
    if (!userCompanyId) {
      toast.error("ID da empresa não encontrado. Por favor, faça login novamente.");
      return;
    }
    try {
      const categoryDataToSave = {
        ...category,
        company_id: userCompanyId,
      };

      const { error } = await supabase
        .from('categories')
        .upsert(categoryDataToSave);

      if (error) throw error;

      toast.success(`Capítulo "${category.nome}" ${category.id ? "atualizado" : "criado"} com sucesso!`);
      onCategoriesUpdated(); // Refresh categories in parent
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao guardar capítulo: ${error.message}`);
      console.error("Erro ao guardar capítulo:", error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar este capítulo? Todos os artigos associados a ele ficarão sem categoria.")) return;
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast.success("Capítulo eliminado com sucesso!");
      onCategoriesUpdated(); // Refresh categories in parent
    } catch (error: any) {
      toast.error(`Erro ao eliminar capítulo: ${error.message}`);
      console.error("Erro ao eliminar capítulo:", error);
    }
  };

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" /> Gestão de Capítulos
        </CardTitle>
        <Button onClick={() => { setCategoryToEdit(null); setIsDialogOpen(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Capítulo
        </Button>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Nenhum capítulo encontrado"
            description="Adicione capítulos para organizar os seus artigos de construção."
            buttonText="Adicionar Primeiro Capítulo"
            onButtonClick={() => { setCategoryToEdit(null); setIsDialogOpen(true); }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{category.nome}</h3>
                  <p className="text-sm text-muted-foreground">{category.descricao || "Sem descrição."}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)} className="flex-1">
                    <Edit className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)} className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <CreateEditCategoryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
      />
    </Card>
  );
};

export default CategoryManagementSection;