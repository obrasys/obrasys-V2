import { z } from "zod";

// Existing BudgetItem schema (adjusted for form use)
export const budgetItemSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new items
  capitulo_id: z.string().uuid().optional().nullable(), // Link to the chapter (internal form ID), now nullable
  capitulo: z.string().min(1, "O capítulo é obrigatório."), // Adicionado: Campo para o nome do capítulo
  servico: z.string().min(1, "O serviço é obrigatório."),
  quantidade: z.coerce.number().min(0.01, "A quantidade deve ser um valor positivo."),
  unidade: z.string().min(1, "A unidade é obrigatória."),
  preco_unitario: z.coerce.number().min(0.01, "O preço unitário deve ser um valor positivo."), // Alterado para min(0.01)
  custo_planeado: z.coerce.number().min(0).default(0), // Calculated field, default to 0
  custo_executado: z.coerce.number().min(0).default(0), // Default to 0 for new items
  custo_real_material: z.coerce.number().min(0).default(0).optional().nullable(), // NOVO: Custo real de material, made optional and nullable
  custo_real_mao_obra: z.coerce.number().min(0).default(0).optional().nullable(), // NOVO: Custo real de mão de obra, made optional and nullable
  desvio: z.coerce.number().default(0), // Calculated field, default to 0
  estado: z.enum(["Em andamento", "Concluído", "Atrasado", "Planeado"], {
    required_error: "O estado é obrigatório.",
  }).default("Planeado"),
  article_id: z.string().uuid().optional().nullable(), // NOVO: ID do artigo da base de dados de artigos
});

export type BudgetItem = z.infer<typeof budgetItemSchema>;

// New schema for a single chapter in the form
export const budgetChapterFormSchema = z.object({
  id: z.string().uuid().optional(), // Internal form ID for chapter
  codigo: z.string().min(1, "O código do capítulo é obrigatório."),
  nome: z.string().min(1, "O nome do capítulo é obrigatório."),
  observacoes: z.string().optional().nullable(),
  items: z.array(budgetItemSchema).min(1, "Cada capítulo deve ter pelo menos um serviço."),
});

export type BudgetChapterForm = z.infer<typeof budgetChapterFormSchema>;

// New schema for the entire budget creation form
export const newBudgetFormSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new budget
  nome: z.string().min(1, "O nome do orçamento é obrigatório."),
  client_id: z.string().uuid("Selecione um cliente válido.").nullable(), // Alterado para nullable
  localizacao: z.string().min(1, "A localização da obra é obrigatória."),
  tipo_obra: z.enum(["Nova construção", "Remodelação", "Ampliação"], {
    required_error: "O tipo de obra é obrigatório.",
  }),
  data_orcamento: z.string().min(1, "A data do orçamento é obrigatória."),
  observacoes_gerais: z.string().optional().nullable(),
  estado: z.enum(["Rascunho", "Aprovado", "Rejeitado"]).default("Rascunho"), // Initial state
  chapters: z.array(budgetChapterFormSchema).min(1, "O orçamento deve ter pelo menos um capítulo."),
});

export type NewBudgetFormValues = z.infer<typeof newBudgetFormSchema>;

// Type for the actual budget stored in DB (simplified, without nested items)
export const budgetDBSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  project_id: z.string().uuid().optional().nullable(),
  nome: z.string(),
  client_id: z.string().uuid().optional().nullable(), // Added
  localizacao: z.string().optional().nullable(), // Added
  tipo_obra: z.enum(["Nova construção", "Remodelação", "Ampliação"]).optional().nullable(), // Added
  data_orcamento: z.string().optional().nullable(), // Added
  observacoes_gerais: z.string().optional().nullable(), // Added
  total_planeado: z.number(),
  total_executado: z.number(),
  estado: z.enum(["Rascunho", "Aprovado", "Rejeitado"]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BudgetDB = z.infer<typeof budgetDBSchema>;

// Define BudgetChapterDB to match the DB structure for chapters
export const budgetChapterDBSchema = z.object({
  id: z.string().uuid(),
  budget_id: z.string().uuid(),
  company_id: z.string().uuid(),
  title: z.string(),
  code: z.string().optional().nullable(),
  sort_order: z.number().int(),
  notes: z.string().optional().nullable(),
  subtotal: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type BudgetChapterDB = z.infer<typeof budgetChapterDBSchema>;

// Define BudgetItemDB to match the DB structure for items
export const budgetItemDBSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  budget_id: z.string().uuid(),
  chapter_id: z.string().uuid().optional().nullable(),
  capitulo: z.string(),
  servico: z.string(),
  quantidade: z.number(),
  unidade: z.string(),
  preco_unitario: z.number(),
  custo_planeado: z.number(),
  custo_executado: z.number(),
  custo_real_material: z.number().optional().nullable(),
  custo_real_mao_obra: z.number().optional().nullable(),
  estado: z.enum(["Em andamento", "Concluído", "Atrasado", "Planeado"]),
  article_id: z.string().uuid().optional().nullable(),
});
export type BudgetItemDB = z.infer<typeof budgetItemDBSchema>;


// Type for a chapter with its items (for fetching)
export type BudgetChapterWithItems = BudgetChapterDB & {
  budget_items: BudgetItemDB[];
};

// Type for a budget with its chapters and items, and client name (for fetching)
export type BudgetWithRelations = BudgetDB & {
  clients: { nome: string } | null;
  budget_chapters: BudgetChapterWithItems[];
};