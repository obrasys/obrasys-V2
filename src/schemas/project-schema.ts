import { z } from "zod";

export const projectSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1, "O nome da obra é obrigatório."),
  cliente: z.string().min(1, "O cliente é obrigatório."),
  localizacao: z.string().min(1, "A localização é obrigatória."),
  estado: z.enum(["Em execução", "Concluída", "Suspensa", "Planeada"], {
    required_error: "O estado é obrigatório.",
  }),
  progresso: z.number().min(0).max(100),
  prazo: z.string(), // Pode ser uma data ou descrição
  custo_planeado: z.coerce.number().min(0),
  custo_real: z.coerce.number().min(0),
});

export type Project = z.infer<typeof projectSchema>;