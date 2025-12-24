"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, FolderOpen } from "lucide-react"; // Removed Chevron icons as Accordion handles them
import { Category, Subcategory } from "@/schemas/article-schema"; // Import Subcategory
import EmptyState from "@/components/EmptyState";
import CreateEditCategoryDialog from "./create-edit-category-dialog";
import CreateEditSubcategoryDialog from "./create-edit-subcategory-dialog"; // NEW: Import subcategory dialog
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Import Accordion components
import { v4 as uuidv4 } from "uuid"; // For new subcategory IDs

interface CategoryManagementSectionProps {
  categories: Category[];
  subcategories: Subcategory[]; // NEW: Pass subcategories
  userCompanyId: string | null;
  onCategoriesUpdated: () => void; // Callback to refresh categories in parent
  onSubcategoriesUpdated: () => void; // NEW: Callback to refresh subcategories in parent
}

const CategoryManagementSection: React.FC<CategoryManagementSectionProps> = ({
  categories,
  subcategories, // Destructure subcategories
  userCompanyId,
  onCategoriesUpdated,
  onSubcategoriesUpdated, // Destructure subcategories callback
}) => {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = React.useState(false);
  const [categoryToEdit, setCategoryToEdit] = React.useState<Category | null>(null);

  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = React.useState(false); // NEW state
  const [subcategoryToEdit, setSubcategoryToEdit] = React.useState<Subcategory | null>(null); // NEW state
  const [currentCategoryIdForSubcategory, setCurrentCategoryIdForSubcategory] = React.useState<string | null>(null); // NEW state

  // --- Category Handlers ---
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

      toast.success(`Categoria "${category.nome}" ${category.id ? "atualizada" : "criada"} com sucesso!`);
      onCategoriesUpdated(); // Refresh categories in parent
      setIsCategoryDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao guardar categoria: ${error.message}`);
      console.error("Erro ao guardar categoria:", error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar esta categoria? Todos os artigos e subcategorias associados a ela ficarão sem categoria.")) return;
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast.success("Categoria eliminada com sucesso!");
      onCategoriesUpdated(); // Refresh categories in parent
      onSubcategoriesUpdated(); // Also refresh subcategories as they might be affected
    } catch (error: any) {
      toast.error(`Erro ao eliminar categoria: ${error.message}`);
      console.error("Erro ao eliminar categoria:", error);
    }
  };

  // --- Subcategory Handlers ---
  const handleAddSubcategoryClick = (categoryId: string) => {
    setCurrentCategoryIdForSubcategory(categoryId);
    setSubcategoryToEdit(null); // Ensure it's a new subcategory
    setIsSubcategoryDialogOpen(true);
  };

  const handleSaveSubcategory = async (subcategory: Subcategory) => {
    if (!userCompanyId || !currentCategoryIdForSubcategory) {
      toast.error("ID da empresa ou ID da categoria em falta.");
      return;
    }
    try {
      const subcategoryDataToSave = {
        ...subcategory,
        company_id: userCompanyId,
        categoria_id: currentCategoryIdForSubcategory, // Ensure it's linked to the current category
        id: subcategory.id || uuidv4(),
      };

      const { error } = await supabase
        .from('subcategories')
        .upsert(subcategoryDataToSave);

      if (error) throw error;

      toast.success(`Subcategoria "${subcategory.nome}" ${subcategory.id ? "atualizada" : "criada"} com sucesso!`);
      onSubcategoriesUpdated(); // Refresh subcategories in parent
      setIsSubcategoryDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao guardar subcategoria: ${error.message}`);
      console.error("Erro ao guardar subcategoria:", error);
    }
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setCurrentCategoryIdForSubcategory(subcategory.categoria_id); // Set the parent category ID
    setSubcategoryToEdit(subcategory);
    setIsSubcategoryDialogOpen(true);
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar esta subcategoria? Todos os artigos associados a ela ficarão sem subcategoria.")) return;
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast.success("Subcategoria eliminada com sucesso!");
      onSubcategoriesUpdated(); // Refresh subcategories in parent
    } catch (error: any) {
      toast.error(`Erro ao eliminar subcategoria: ${error.message}`);
      console.error("Erro ao eliminar subcategoria:", error);
    }
  };

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" /> Gestão de Categorias e Subcategorias
        </CardTitle>
        <Button onClick={() => { setCategoryToEdit(null); setIsCategoryDialogOpen(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Categoria
        </Button>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Nenhuma categoria de artigo encontrada"
            description="Adicione categorias para organizar os seus artigos de construção."
            buttonText="Adicionar Primeira Categoria"
            onButtonClick={() => { setCategoryToEdit(null); setIsCategoryDialogOpen(true); }}
          />
        ) : (
          <Accordion type="multiple" className="w-full">
            {categories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{category.nome}</span>
                    <span className="text-sm text-muted-foreground">{category.descricao}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t bg-muted/10">
                  <div className="flex justify-end gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                      <Edit className="h-4 w-4 mr-2" /> Editar Categoria
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Eliminar Categoria
                    </Button>
                    <Button size="sm" onClick={() => handleAddSubcategoryClick(category.id)}>
                      <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Subcategoria
                    </Button>
                  </div>

                  <h4 className="font-semibold text-md mb-2">Subcategorias:</h4>
                  {subcategories.filter(sub => sub.categoria_id === category.id).length === 0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title="Nenhuma subcategoria encontrada"
                      description="Adicione subcategorias para refinar a organização dos seus artigos."
                      buttonText="Adicionar Primeira Subcategoria"
                      onButtonClick={() => handleAddSubcategoryClick(category.id)}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subcategories.filter(sub => sub.categoria_id === category.id).map((sub) => (
                        <Card key={sub.id} className="p-3 flex flex-col justify-between">
                          <div>
                            <h5 className="font-medium text-base mb-1">{sub.nome}</h5>
                            <p className="text-xs text-muted-foreground">{sub.descricao || "Sem descrição."}</p>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" onClick={() => handleEditSubcategory(sub)} className="flex-1">
                              <Edit className="h-3 w-3 mr-1" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteSubcategory(sub.id)} className="flex-1">
                              <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>

      <CreateEditCategoryDialog
        isOpen={isCategoryDialogOpen}
        onClose={() => setIsCategoryDialogOpen(false)}
        onSave={handleSaveCategory}
        categoryToEdit={categoryToEdit}
      />

      <CreateEditSubcategoryDialog
        isOpen={isSubcategoryDialogOpen}
        onClose={() => setIsSubcategoryDialogOpen(false)}
        onSave={handleSaveSubcategory}
        subcategoryToEdit={subcategoryToEdit}
        categoryId={currentCategoryIdForSubcategory} // Pass the category ID to link
      />
    </Card>
  );
};

export default CategoryManagementSection;