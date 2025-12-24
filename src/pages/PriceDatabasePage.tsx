"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Download, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/work-items/data-table";
import { createColumns } from "@/components/work-items/columns";
import CreateEditArticleDialog from "@/components/work-items/create-edit-article-dialog";
import CategoryManagementSection from "@/components/work-items/category-management-section"; // Import new component
import ImportArticlesDialog from "@/components/work-items/ImportArticlesDialog"; // NEW: Import ImportArticlesDialog
import { Article, Category, Subcategory } from "@/schemas/article-schema";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureDefaultCategories } from "@/utils/initial-data"; // Import new utility

const WorkItemsPage = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);

  const [articles, setArticles] = React.useState<Article[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [subcategories, setSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [isArticleDialogOpen, setIsArticleDialogOpen] = React.useState(false); // Renamed for clarity
  const [articleToEdit, setArticleToEdit] = React.useState<Article | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false); // NEW: State for import dialog

  // Fetch user's company ID
  const fetchUserCompanyId = React.useCallback(async () => {
    if (!user) {
      setUserCompanyId(null);
      return;
    }
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Erro ao carregar company_id do perfil:", profileError);
      setUserCompanyId(null);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
  }, [user]);

  // Fetch articles
  const fetchArticles = React.useCallback(async () => {
    if (!userCompanyId) {
      setArticles([]);
      return;
    }
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('company_id', userCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar artigos: ${error.message}`);
      console.error("Erro ao carregar artigos:", error);
      setArticles([]);
    } else {
      setArticles(data || []);
    }
  }, [userCompanyId]);

  // Fetch categories
  const fetchCategories = React.useCallback(async () => {
    if (!userCompanyId) {
      setCategories([]);
      return;
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', userCompanyId)
      .order('nome', { ascending: true });

    if (error) {
      toast.error(`Erro ao carregar categorias: ${error.message}`);
      console.error("Erro ao carregar categorias:", error);
      setCategories([]);
    } else {
      setCategories(data || []);
    }
  }, [userCompanyId]);

  // Fetch subcategories
  const fetchSubcategories = React.useCallback(async () => {
    if (!userCompanyId) {
      setSubcategories([]);
      return;
    }
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('company_id', userCompanyId)
      .order('nome', { ascending: true });

    if (error) {
      toast.error(`Erro ao carregar subcategorias: ${error.message}`);
      console.error("Erro ao carregar subcategorias:", error);
      setSubcategories([]);
    } else {
      setSubcategories(data || []);
    }
  }, [userCompanyId]);

  // Initial data load and ensure default categories
  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  React.useEffect(() => {
    const loadAllData = async () => {
      if (userCompanyId) {
        setIsLoadingData(true);
        await ensureDefaultCategories(userCompanyId); // Ensure default categories exist
        await Promise.all([
          fetchArticles(),
          fetchCategories(),
          fetchSubcategories(),
        ]);
        setIsLoadingData(false);
      }
    };
    loadAllData();
  }, [userCompanyId, fetchArticles, fetchCategories, fetchSubcategories]);

  const handleSaveArticle = async (article: Article) => {
    if (!userCompanyId) {
      toast.error("ID da empresa não encontrado. Por favor, faça login novamente.");
      return;
    }
    try {
      const articleDataToSave = {
        ...article,
        company_id: userCompanyId,
        id: article.id || uuidv4(), // Generate ID if new article
      };

      const { error } = await supabase
        .from('articles')
        .upsert(articleDataToSave);

      if (error) throw error;

      toast.success(`Artigo ${article.id ? "atualizado" : "criado"} com sucesso!`);
      fetchArticles(); // Refresh the list
      setIsArticleDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao guardar artigo: ${error.message}`);
      console.error("Erro ao guardar artigo:", error);
    }
  };

  const handleEditArticle = (article: Article) => {
    setArticleToEdit(article);
    setIsArticleDialogOpen(true);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar este artigo?")) return;
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)
        .eq('company_id', userCompanyId); // Ensure RLS is respected

      if (error) throw error;

      toast.success("Artigo eliminado com sucesso!");
      fetchArticles(); // Refresh the list
    } catch (error: any) {
      toast.error(`Erro ao eliminar artigo: ${error.message}`);
      console.error("Erro ao eliminar artigo:", error);
    }
  };

  const columns = createColumns({
    onEdit: handleEditArticle,
    onDelete: handleDeleteArticle,
  });

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader><CardTitle><Skeleton className="h-6 w-48" /></CardTitle></CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Base de Artigos de Construção
        </h1>
      </div>

      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Gerencie o seu catálogo interno de serviços, materiais e equipas com precisão e eficiência.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Use the dedicated CategoryManagementSection component */}
      <CategoryManagementSection
        categories={categories}
        userCompanyId={userCompanyId}
        onCategoriesUpdated={fetchCategories} // Pass the fetchCategories callback
      />

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Catálogo Central de Artigos</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setArticleToEdit(null); setIsArticleDialogOpen(true); }} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Novo Artigo
            </Button>
            <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Importar CSV
            </Button>
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <History className="h-4 w-4" /> Histórico de Preços
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={articles}
            filterColumnId="descricao"
            filterPlaceholder="Filtrar por descrição..."
          />
        </CardContent>
      </Card>

      <CreateEditArticleDialog
        isOpen={isArticleDialogOpen}
        onClose={() => setIsArticleDialogOpen(false)}
        onSave={handleSaveArticle}
        articleToEdit={articleToEdit}
        categories={categories}
        subcategories={subcategories}
      />

      {userCompanyId && (
        <ImportArticlesDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportSuccess={fetchArticles}
          userCompanyId={userCompanyId}
        />
      )}
    </div>
  );
};

export default WorkItemsPage;