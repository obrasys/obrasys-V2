"use client";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category } from "@/schemas/article-schema";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { nome: "01 – Trabalhos Preparatórios", descricao: "Atividades iniciais e de preparação do local da obra." },
  { nome: "02 – Demolições", descricao: "Remoção de estruturas existentes." },
  { nome: "03 – Movimento de Terras", descricao: "Escavações, aterros e nivelamento do terreno." },
  { nome: "04 – Estruturas", descricao: "Construção de fundações, pilares, vigas e lajes." },
  { nome: "05 – Alvenarias", descricao: "Construção de paredes e divisórias." },
  { nome: "06 – Coberturas", descricao: "Instalação de telhados e sistemas de impermeabilização." },
  { nome: "07 – Revestimentos", descricao: "Aplicação de materiais de acabamento em superfícies." },
  { nome: "08 – Canalizações", descricao: "Instalação de sistemas de água e esgoto." },
  { nome: "09 – Eletricidade", descricao: "Instalação de sistemas elétricos." },
  { nome: "10 – AVAC", descricao: "Instalação de sistemas de aquecimento, ventilação e ar condicionado." },
  { nome: "11 – Carpintarias", descricao: "Instalação de elementos de madeira, como portas e armários." },
  { nome: "12 – Acabamentos", descricao: "Pinturas, pavimentos e outros detalhes finais." },
  { nome: "13 – Arranjos Exteriores", descricao: "Paisagismo, pavimentos exteriores e infraestruturas." },
];

export async function ensureDefaultCategories(companyId: string) {
  if (!companyId) {
    console.error("ensureDefaultCategories: companyId is missing.");
    return;
  }

  try {
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('nome')
      .eq('company_id', companyId);

    if (fetchError) {
      throw new Error(`Erro ao verificar categorias existentes: ${fetchError.message}`);
    }

    const existingCategoryNames = new Set(existingCategories.map(cat => cat.nome));
    const categoriesToInsert = DEFAULT_CATEGORIES.filter(
      defaultCat => !existingCategoryNames.has(defaultCat.nome)
    ).map(defaultCat => ({
      ...defaultCat,
      id: uuidv4(), // Generate UUID for new categories
      company_id: companyId,
    }));

    if (categoriesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('categories')
        .insert(categoriesToInsert);

      if (insertError) {
        throw new Error(`Erro ao inserir categorias padrão: ${insertError.message}`);
      }
      toast.success(`${categoriesToInsert.length} categorias padrão adicionadas!`);
    } else {
      console.log("Todas as categorias padrão já existem.");
    }
  } catch (error: any) {
    console.error("Erro em ensureDefaultCategories:", error);
    toast.error(`Falha ao configurar categorias padrão: ${error.message}`);
  }
}