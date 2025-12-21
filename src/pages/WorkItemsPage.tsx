"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle, Upload, Download, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/work-items/data-table";
import { createColumns } from "@/components/work-items/columns";
import CreateEditArticleDialog from "@/components/work-items/create-edit-article-dialog";
import { Article, Category, Subcategory } from "@/schemas/article-schema";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const mockCategories: Category[] = [
  { id: uuidv4(), nome: "Materiais Básicos", descricao: "Materiais fundamentais para a construção" },
  { id: uuidv4(), nome: "Acabamentos", descricao: "Materiais para o acabamento final" },
  { id: uuidv4(), nome: "Serviços", descricao: "Serviços de mão de obra e subempreitadas" },
  { id: uuidv4(), nome: "Equipamentos", descricao: "Aluguer ou uso de equipamentos" },
];

const mockSubcategories: Subcategory[] = [
  { id: uuidv4(), categoria_id: mockCategories[0].id, nome: "Concreto", descricao: "Tipos de concreto" },
  { id: uuidv4(), categoria_id: mockCategories[0].id, nome: "Aço", descricao: "Vergalhões e estruturas metálicas" },
  { id: uuidv4(), categoria_id: mockCategories[1].id, nome: "Pisos", descricao: "Tipos de revestimento de piso" },
  { id: uuidv4(), categoria_id: mockCategories[2].id, nome: "Alvenaria", descricao: "Serviços de construção de paredes" },
];

const initialMockArticles: Article[] = [
  {
    id: uuidv4(),
    codigo: "A.01.01.03",
    descricao: "Concreto fck=25MPa com brita 1 e areia média, fornecido usinado",
    unidade: "m³",
    categoria_id: mockCategories[0].id,
    subcategoria_id: mockSubcategories[0].id,
    tipo: "material",
    preco_unitario: 495.30,
    fonte_referencia: "SINAPI",
    observacoes: "Para estruturas de concreto armado",
  },
  {
    id: uuidv4(),
    codigo: "S.02.01.01",
    descricao: "Mão de obra para assentamento de alvenaria de vedação",
    unidade: "m²",
    categoria_id: mockCategories[2].id,
    subcategoria_id: mockSubcategories[3].id,
    tipo: "servico",
    preco_unitario: 35.00,
    fonte_referencia: "Manual Interno",
    observacoes: "Inclui argamassa e rejunte",
  },
  {
    id: uuidv4(),
    codigo: "M.03.01.05",
    descricao: "Cimento Portland CP II-Z-32",
    unidade: "saco (50kg)",
    categoria_id: mockCategories[0].id,
    subcategoria_id: mockSubcategories[0].id,
    tipo: "material",
    preco_unitario: 28.50,
    fonte_referencia: "CYPE",
    observacoes: "Para uso geral em argamassas e concretos",
  },
];

const WorkItemsPage = () => {
  const [articles, setArticles] = React.useState<Article[]>(initialMockArticles);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [articleToEdit, setArticleToEdit] = React.useState<Article | null>(null);

  const handleSaveArticle = (newArticle: Article) => {
    if (newArticle.id && articles.some((a) => a.id === newArticle.id)) {
      setArticles(articles.map((a) => (a.id === newArticle.id ? newArticle : a)));
    } else {
      setArticles([...articles, { ...newArticle, id: uuidv4() }]);
    }
  };

  const handleEditArticle = (article: Article) => {
    setArticleToEdit(article);
    setIsDialogOpen(true);
  };

  const handleDeleteArticle = (id: string) => {
    setArticles(articles.filter((a) => a.id !== id));
    toast.success("Artigo eliminado com sucesso!");
  };

  const columns = createColumns({
    onEdit: handleEditArticle,
    onDelete: handleDeleteArticle,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto p-6 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 pb-6">
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar à Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
            Módulo: Base de Artigos de Construção
          </h1>
          <div className="w-48 md:block hidden"></div> {/* Placeholder for alignment on larger screens */}
        </div>

        {/* Introduction Section */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
            Gerencie seu catálogo interno de serviços, materiais e equipes com precisão e eficiência.
          </p>
        </section>

        <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

        {/* Main Content */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">Catálogo Central de Artigos</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={() => { setArticleToEdit(null); setIsDialogOpen(true); }} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Novo Artigo
              </Button>
              <Button variant="outline" className="flex items-center gap-2" disabled>
                <Upload className="h-4 w-4" /> Importar
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
      </div>

      <CreateEditArticleDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveArticle}
        articleToEdit={articleToEdit}
        categories={mockCategories}
        subcategories={mockSubcategories}
      />
    </div>
  );
};

export default WorkItemsPage;