"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Download, ArrowLeft, Search, DollarSign, Clock } from "lucide-react"; // Adicionado DollarSign, substituído History por Clock
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/work-items/data-table";
import { createPriceDatabaseColumns } from "@/components/price-database/columns"; // NEW: Import specific columns
import CreateEditArticleDialog from "@/components/work-items/create-edit-article-dialog";
import ImportArticlesDialog from "@/components/work-items/ImportArticlesDialog";
import KPICard from "@/components/KPICard"; // Import KPICard
import { Article, Category, Subcategory } from "@/schemas/article-schema";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureDefaultCategories } from "@/utils/initial-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import { Input } from "@/components/ui/input"; // Import Input

const PriceDatabasePage = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);

  const [articles, setArticles] = React.useState<Article[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [subcategories, setSubcategories] = React.useState<Subcategory[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const [isArticleDialogOpen, setIsArticleDialogOpen] = React.useState(false);
  const [articleToEdit, setArticleToEdit] = React.useState<Article | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedSource, setSelectedSource] = React.useState<string | null>(null);

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

  // Fetch articles with category and subcategory names
  const fetchArticles = React.useCallback(async () => {
    if (!userCompanyId) {
      setArticles([]);
      return;
    }
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(nome), subcategories(nome)')
      .eq('company_id', userCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar artigos: ${error.message}`);
      console.error("Erro ao carregar artigos:", error);
      setArticles([]);
    } else {
      const formattedArticles: Article[] = (data || []).map((article: any) => ({
        ...article,
        category_name: article.categories?.nome || "N/A",
        subcategory_name: article.subcategories?.nome || "N/A",
      }));
      setArticles(formattedArticles);
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

  // Fetch subcategories (needed for CreateEditArticleDialog)
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
        await ensureDefaultCategories(userCompanyId);
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
        id: article.id || uuidv4(),
      };

      const { error } = await supabase
        .from('articles')
        .upsert(articleDataToSave);

      if (error) throw error;

      toast.success(`Artigo ${article.id ? "atualizado" : "criado"} com sucesso!`);
      fetchArticles();
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
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast.success("Artigo eliminado com sucesso!");
      fetchArticles();
    } catch (error: any) {
      toast.error(`Erro ao eliminar artigo: ${error.message}`);
      console.error("Erro ao eliminar artigo:", error);
    }
  };

  const columns = createPriceDatabaseColumns({ // Use new columns
    onCopy: (id: string) => {
      navigator.clipboard.writeText(id);
      toast.info("ID do Artigo copiado para a área de transferência!");
    },
    onEdit: handleEditArticle,
  });

  const filteredArticles = React.useMemo(() => {
    let filtered = articles;

    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(article => article.categoria_id === selectedCategory);
    }

    if (selectedSource) {
      filtered = filtered.filter(article => article.fonte_referencia === selectedSource);
    }

    return filtered;
  }, [articles, searchTerm, selectedCategory, selectedSource]);

  // Calculate KPIs
  const uniqueArticlesCount = articles.length; // For now, all are unique
  const companyArticlesCount = articles.length; // For now, all are company articles
  const publicCatalogCount = 0; // Mock for now
  const standardCatalogCount = 241; // Mock for now
  const averagePrice = articles.length > 0
    ? articles.reduce((sum, article) => sum + article.preco_unitario, 0) / articles.length
    : 0;

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <Skeleton className="h-8 w-64 bg-gray-200 rounded mb-2" />
            <Skeleton className="h-4 w-48 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <KPICard
              key={i}
              title=""
              value=""
              description=""
              icon={Search}
              iconColorClass="text-transparent"
            />
          ))}
        </div>
        <div className="flex items-center py-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40 ml-auto" />
          <Skeleton className="h-10 w-40 ml-2" />
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
          Base de Preços Unificada
        </h1>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Importar CSV
          </Button>
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={() => { setArticleToEdit(null); setIsArticleDialogOpen(true); }} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Novo Artigo
          </Button>
        </div>
      </div>

      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Gerir artigos personalizados e utilizar a base partilhada.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
        <KPICard
          title="Personalizados"
          value={`${uniqueArticlesCount}`}
          description="artigos únicos"
          icon={PlusCircle}
          iconColorClass="text-blue-500"
        />
        <KPICard
          title="Empresa"
          value={`${companyArticlesCount}`}
          description="da empresa"
          icon={Download}
          iconColorClass="text-green-500"
        />
        <KPICard
          title="Sistema"
          value={`${publicCatalogCount}`}
          description="catálogo público"
          icon={Upload}
          iconColorClass="text-purple-500"
        />
        <KPICard
          title="Catálogo Padrão"
          value={`${standardCatalogCount}`}
          description="artigos padrão"
          icon={Clock}
          iconColorClass="text-orange-500"
        />
        <KPICard
          title="Preço Médio"
          value={`${averagePrice.toFixed(2)} €`}
          description="por artigo"
          icon={DollarSign}
          iconColorClass="text-red-500"
        />
      </section>

      <div className="flex items-center py-4 gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar artigos..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="max-w-sm pl-10"
          />
        </div>
        <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>{category.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSource || "all"} onValueChange={(value) => setSelectedSource(value === "all" ? null : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as fontes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fontes</SelectItem>
            {/* Mock sources for now, or derive from articles */}
            <SelectItem value="Catálogo Padrão">Catálogo Padrão</SelectItem>
            <SelectItem value="Fornecedor">Fornecedor</SelectItem>
            <SelectItem value="Mercado">Mercado</SelectItem>
            <SelectItem value="Tabela Salarial">Tabela Salarial</SelectItem>
            <SelectItem value="Custo Interno">Custo Interno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Artigos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredArticles}
            filterColumnId="descricao" // Filter by description for the search input
            filterPlaceholder="Filtrar por descrição..." // This will be hidden by the custom search input
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

export default PriceDatabasePage;