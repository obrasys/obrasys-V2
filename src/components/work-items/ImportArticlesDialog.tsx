"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Article, Category, Subcategory } from "@/schemas/article-schema";
import { useSession } from "@/components/SessionContextProvider"; // Import useSession
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface ImportArticlesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  userCompanyId: string;
}

const ImportArticlesDialog: React.FC<ImportArticlesDialogProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  userCompanyId,
}) => {
  const navigate = useNavigate();
  const { profile } = useSession(); // Get profile from session

  const userPlanType = profile?.plan_type || 'trialing';
  const isInitiantePlan = userPlanType === 'iniciante' || userPlanType === 'trialing';

  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    errors: number;
    messages: string[];
  } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setImportSummary(null);
    } else {
      setFile(null);
    }
  };

  const mapPortugueseTypeToEnum = (type: string): Article['tipo'] => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("serviço")) return "servico";
    if (lowerType.includes("material")) return "material";
    if (lowerType.includes("equipa") || lowerType.includes("equipe")) return "equipe";
    return "material"; // Default to material if not recognized
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Por favor, selecione um ficheiro CSV para importar.");
      return;
    }
    if (!userCompanyId) {
      toast.error("ID da empresa não encontrado. Por favor, faça login novamente.");
      return;
    }

    if (isInitiantePlan) {
      toast.error("A importação de artigos não está disponível no seu plano 'Iniciante'. Faça upgrade para aceder a esta funcionalidade.");
      navigate("/plans");
      return;
    }

    setIsImporting(true);
    setImportSummary(null);
    const messages: string[] = [];
    let importedCount = 0;
    let errorCount = 0;
    let totalRows = 0;

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as any[];
          totalRows = rows.length;

          if (totalRows === 0) {
            messages.push("O ficheiro CSV está vazio ou não contém dados válidos.");
            setImportSummary({ total: 0, imported: 0, errors: 0, messages });
            setIsImporting(false);
            return;
          }

          // Fetch existing categories and subcategories to avoid re-fetching in loop
          const { data: existingCategories, error: catError } = await supabase
            .from('categories')
            .select('id, nome')
            .eq('company_id', userCompanyId);
          if (catError) throw new Error(`Erro ao carregar categorias: ${catError.message}`);
          const categoryMap = new Map<string, string>(existingCategories.map(c => [c.nome.toLowerCase(), c.id]));

          const { data: existingSubcategories, error: subCatError } = await supabase
            .from('subcategories')
            .select('id, nome, categoria_id')
            .eq('company_id', userCompanyId);
          if (subCatError) throw new Error(`Erro ao carregar subcategorias: ${subCatError.message}`);
          const subcategoryMap = new Map<string, Subcategory>(existingSubcategories.map(sc => [`${sc.categoria_id}-${sc.nome.toLowerCase()}`, sc]));

          const articlesToUpsert: Article[] = [];

          for (const [index, row] of rows.entries()) {
            const rowNum = index + 1;
            try {
              const categoriaNome = row["Categoria"]?.trim();
              const subcategoriaNome = row["Subcategoria"]?.trim();
              const codigo = row["Código"]?.trim();
              const descricao = row["Descrição"]?.trim();
              const unidade = row["Unidade"]?.trim();
              const precoUnitario = parseFloat(row["Preço Unitário"]);
              const tipo = mapPortugueseTypeToEnum(row["Tipo"]?.trim() || "");
              const fonteReferencia = row["Fonte de Referência"]?.trim();
              const observacoes = row["Observações"]?.trim();

              if (!codigo || !descricao || !unidade || isNaN(precoUnitario) || precoUnitario < 0 || !tipo || !fonteReferencia || !categoriaNome) {
                throw new Error(`Dados incompletos ou inválidos na linha ${rowNum}. Campos obrigatórios: Código, Descrição, Unidade, Preço Unitário, Tipo, Fonte de Referência, Categoria.`);
              }

              let categoryId: string | null = categoryMap.get(categoriaNome.toLowerCase()) || null;
              if (!categoryId) {
                const { data: newCat, error: insertCatError } = await supabase
                  .from('categories')
                  .insert({ id: uuidv4(), company_id: userCompanyId, nome: categoriaNome, descricao: categoriaNome })
                  .select('id')
                  .single();
                if (insertCatError) throw new Error(`Erro ao criar categoria '${categoriaNome}': ${insertCatError.message}`);
                categoryId = newCat.id;
                categoryMap.set(categoriaNome.toLowerCase(), categoryId);
                messages.push(`Categoria '${categoriaNome}' criada.`);
              }

              let subcategoryId: string | null = null;
              if (subcategoriaNome && categoryId) {
                const subcategoryKey = `${categoryId}-${subcategoriaNome.toLowerCase()}`;
                const existingSub = subcategoryMap.get(subcategoryKey);
                if (existingSub) {
                  subcategoryId = existingSub.id;
                } else {
                  const { data: newSubCat, error: insertSubCatError } = await supabase
                    .from('subcategories')
                    .insert({ id: uuidv4(), company_id: userCompanyId, categoria_id: categoryId, nome: subcategoriaNome, descricao: subcategoriaNome })
                    .select('id')
                    .single();
                  if (insertSubCatError) throw new Error(`Erro ao criar subcategoria '${subcategoriaNome}' para categoria '${categoriaNome}': ${insertSubCatError.message}`);
                  subcategoryId = newSubCat.id;
                  subcategoryMap.set(subcategoryKey, { id: subcategoryId, nome: subcategoriaNome, categoria_id: categoryId });
                  messages.push(`Subcategoria '${subcategoriaNome}' criada.`);
                }
              }

              articlesToUpsert.push({
                id: uuidv4(), // Will be overwritten if existing, otherwise new
                company_id: userCompanyId,
                codigo,
                descricao,
                unidade,
                categoria_id: categoryId,
                subcategoria_id: subcategoryId,
                tipo,
                preco_unitario: precoUnitario,
                fonte_referencia: fonteReferencia,
                observacoes,
              });
            } catch (rowError: any) {
              errorCount++;
              messages.push(`Erro na linha ${rowNum}: ${rowError.message}`);
              console.error(`Erro na linha ${rowNum}:`, rowError);
            }
          }

          if (articlesToUpsert.length > 0) {
            // Perform bulk upsert
            const { error: upsertError } = await supabase
              .from('articles')
              .upsert(articlesToUpsert, { onConflict: 'company_id, codigo' }); // Conflict on company_id and codigo

            if (upsertError) {
              throw new Error(`Erro ao inserir/atualizar artigos: ${upsertError.message}`);
            }
            importedCount = articlesToUpsert.length;
            messages.push(`${importedCount} artigos importados/atualizados com sucesso.`);
          } else {
            messages.push("Nenhum artigo válido para importar.");
          }

          setImportSummary({ total: totalRows, imported: importedCount, errors: errorCount, messages });
          if (errorCount === 0) {
            toast.success("Importação de artigos concluída com sucesso!");
            onImportSuccess();
          } else {
            toast.error(`Importação concluída com ${errorCount} erros.`);
          }
        },
        error: (error) => {
          errorCount++;
          messages.push(`Erro ao analisar CSV: ${error.message}`);
          setImportSummary({ total: 0, imported: 0, errors: errorCount, messages });
          toast.error(`Erro ao analisar CSV: ${error.message}`);
          console.error("Erro ao analisar CSV:", error);
        },
      });
    } catch (error: any) {
      errorCount++;
      messages.push(`Erro inesperado durante a importação: ${error.message}`);
      setImportSummary({ total: totalRows, imported: importedCount, errors: errorCount, messages });
      toast.error(`Erro inesperado durante a importação: ${error.message}`);
      console.error("Erro inesperado durante a importação:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseDialog = () => {
    setFile(null);
    setImportSummary(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Importar Artigos de Construção (CSV)</DialogTitle>
          <DialogDescription>
            Carregue um ficheiro CSV para importar ou atualizar artigos na sua base de dados.
            O ficheiro deve conter as colunas: Categoria, Subcategoria (opcional), Código, Descrição, Unidade, Preço Unitário, Tipo (Serviço/Material/Equipa), Fonte de Referência, Observações (opcional).
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">Ficheiro CSV</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} disabled={isImporting} />
            {file && <p className="text-sm text-muted-foreground">Ficheiro selecionado: {file.name}</p>}
          </div>

          {importSummary && (
            <div className="mt-4 p-4 border rounded-md bg-muted/20">
              <h3 className="font-semibold text-md mb-2">Resumo da Importação:</h3>
              <p className="text-sm">Total de linhas processadas: {importSummary.total}</p>
              <p className="text-sm text-green-600">Artigos importados/atualizados: {importSummary.imported}</p>
              <p className="text-sm text-red-600">Erros: {importSummary.errors}</p>
              {importSummary.messages.length > 0 && (
                <div className="mt-3 space-y-1 text-xs max-h-40 overflow-y-auto border p-2 rounded-md bg-background">
                  <p className="font-medium">Mensagens:</p>
                  {importSummary.messages.map((msg, i) => (
                    <p key={i} className={msg.startsWith("Erro") ? "text-red-500" : msg.includes("criada") ? "text-blue-500" : "text-muted-foreground"}>
                      {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCloseDialog} disabled={isImporting}>
            Fechar
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A Importar...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" /> Iniciar Importação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportArticlesDialog;