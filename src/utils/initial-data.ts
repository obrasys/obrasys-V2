"use client";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category, Subcategory, Article } from "@/schemas/article-schema";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";

/* =========================
   DEFAULT CATEGORIES
========================= */

const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
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

/* =========================
   ENSURE DEFAULT CATEGORIES
========================= */

export async function ensureDefaultCategories(companyId: string) {
  if (!companyId) return;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("nome")
      .eq("company_id", companyId);

    if (error) {
      console.warn("[ensureDefaultCategories] fetch falhou:", error);
      return;
    }

    const existing = new Set((data ?? []).map((c) => c.nome));

    const toInsert = DEFAULT_CATEGORIES.filter(
      (cat) => !existing.has(cat.nome)
    ).map((cat) => ({
      ...cat,
      id: uuidv4(),
      company_id: companyId,
    }));

    if (!toInsert.length) return;

    const { error: insertError } = await supabase
      .from("categories")
      .insert(toInsert);

    if (insertError) {
      console.error("[ensureDefaultCategories] insert falhou:", insertError);
      return;
    }

    toast.success(`${toInsert.length} categorias padrão adicionadas`);
  } catch (err) {
    console.error("[ensureDefaultCategories] erro inesperado:", err);
  }
}

/* =========================
   ARTICLES CSV
========================= */

const DEFAULT_ARTICLES_CSV = `Categoria;Subcategoria;Código;Serviço;Tipo;Unidade;Preço Min;Preço Max;Média Estimada;Fonte de Referência;Notas
Mão de Obra (Geral);;MO-001;Oficial de Construção (Pedreiro);Mão de Obra;Hora;30.50;60.00;30.50;Tabela Salarial;Valor base oficial vs mercado urbano
...`;

/* =========================
   HELPERS
========================= */

const mapPortugueseTypeToEnum = (type: string): Article["tipo"] => {
  const t = type.toLowerCase();
  if (t.includes("serviço") || t.includes("fornecimento") || t.includes("aluguer")) return "servico";
  if (t.includes("mão de obra") || t.includes("equipa")) return "equipe";
  return "material";
};

/* =========================
   SEED DEFAULT ARTICLES
========================= */

export async function seedDefaultArticles(companyId: string) {
  if (!companyId) return;

  try {
    const { data: company, error } = await supabase
      .from("companies")
      .select("default_articles_seeded")
      .eq("id", companyId)
      .single();

    if (error) {
      console.warn("[seedDefaultArticles] não foi possível verificar estado:", error);
      return;
    }

    if (company?.default_articles_seeded) return;

    const parsed = Papa.parse(DEFAULT_ARTICLES_CSV, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
    });

    const rows = parsed.data as any[];
    if (!rows.length) return;

    const { data: categories } = await supabase
      .from("categories")
      .select("id, nome")
      .eq("company_id", companyId);

    const categoryMap = new Map(
      (categories ?? []).map((c) => [c.nome.toLowerCase(), c.id])
    );

    const articles: Article[] = [];

    for (const row of rows) {
      const categoria = row["Categoria"]?.trim();
      if (!categoria) continue;

      const categoryId = categoryMap.get(categoria.toLowerCase());
      if (!categoryId) continue;

      articles.push({
        id: uuidv4(),
        company_id: companyId,
        codigo: row["Código"]?.trim(),
        descricao: row["Serviço"]?.trim(),
        unidade: row["Unidade"]?.trim(),
        categoria_id: categoryId,
        subcategoria_id: null,
        tipo: mapPortugueseTypeToEnum(row["Tipo"] ?? ""),
        preco_unitario: Number(row["Média Estimada"]) || 0,
        fonte_referencia: row["Fonte de Referência"] ?? "",
        observacoes: row["Notas"] ?? "",
      });
    }

    if (!articles.length) return;

    const { error: insertError } = await supabase
      .from("articles")
      .insert(articles);

    if (insertError) {
      console.error("[seedDefaultArticles] erro ao inserir artigos:", insertError);
      return;
    }

    await supabase
      .from("companies")
      .update({ default_articles_seeded: true })
      .eq("id", companyId);

    toast.success(`${articles.length} artigos padrão carregados`);
  } catch (err) {
    console.error("[seedDefaultArticles] erro inesperado:", err);
  }
}
