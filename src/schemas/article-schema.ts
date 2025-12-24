import { z } from "zod";

export const articleSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(), // Adicionado: company_id é obrigatório
  codigo: z.string().min(1, "O código é obrigatório."),
  descricao: z.string().min(1, "A descrição é obrigatória."),
  unidade: z.string().min(1, "A unidade é obrigatória."),
  categoria_id: z.string().uuid("Selecione uma categoria válida."),
  subcategoria_id: z.string().uuid("Selecione uma subcategoria válida.").optional(),
  tipo: z.enum(["servico", "material", "equipe"], {
    required_error: "O tipo é obrigatório.",
  }),
  preco_unitario: z.coerce.number().min(0, "O preço unitário deve ser um valor positivo."),
  fonte_referencia: z.string().min(1, "A fonte de referência é obrigatória."),
  observacoes: z.string().optional(),
});

export type Article = z.infer<typeof articleSchema>;

export const categorySchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;

export const subcategorySchema = z.object({
  id: z.string().uuid(),
  categoria_id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().optional(),
});

export type Subcategory = z.infer<typeof subcategorySchema>;