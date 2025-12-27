"use client";

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDays, formatISO } from 'date-fns'; // Import addDays and formatISO

// Define o schema de validação para o formulário de cadastro
const signupSchema = z.object({
  fullName: z.string().min(1, "O nome completo é obrigatório."),
  email: z.string().email("Formato de email inválido.").min(1, "O email é obrigatório."),
  phone: z.string().min(1, "O telefone é obrigatório."),
  company: z.string().min(1, "O nome da empresa é obrigatório."),
  companyType: z.enum(["Empresa", "Profissional independente", "Entidade pública"], {
    required_error: "O tipo de empresa é obrigatório.",
  }), // NEW: companyType
  nif: z.string().optional(),
  password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
  confirmPassword: z.string().min(1, "Confirme a sua palavra-passe."),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Deve aceitar os Termos de Serviço e a Política de Privacidade.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As palavras-passe não coincidem.",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Espera robusta pelo company_id criado pelo trigger, com timeout curto
  async function waitForCompanyId(userId: string, maxAttempts = 8, delayMs = 600): Promise<string | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      if (!error && data?.company_id) {
        return data.company_id as string;
      }
      // Pequena espera antes da próxima tentativa
      await new Promise((res) => setTimeout(res, delayMs));
    }
    return null;
  }

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      company: "",
      companyType: "Empresa", // Default company type
      nif: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsSubmitting(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            company: data.company,
            nif: data.nif,
            company_type: data.companyType,
          },
        },
      });

      if (authError) {
        const msg = authError.message || "";
        if (typeof (authError as any)?.status === "number" && (authError as any).status === 429) {
          toast.error("Muitas tentativas. Aguarde alguns segundos e tente novamente.");
        } else if (msg.toLowerCase().includes("already")) {
          toast.error("Este email já está registado. Tente iniciar sessão.");
        } else {
          toast.error(`Erro ao registar: ${msg}`);
        }
        return;
      }

      // NÃO tentar ler profile/company_id nem criar subscrição aqui.
      // O utilizador ainda não tem sessão e o trigger pode demorar.
      toast.success('Registo efetuado com sucesso! Verifique o seu email para confirmar a conta.');
      navigate('/login');
    } catch (error: any) {
      toast.error(`Ocorreu um erro inesperado: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <img src="/marca_nav_bar.png" alt="Obra Sys Logo" className="h-10 sm:h-12 w-auto mb-2 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-primary dark:text-primary-foreground">
            Criar Conta
          </h1>
          <p className="text-center text-muted-foreground text-sm">
            Registe-se para começar a gerir as suas obras
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome e Apelido *</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="joao@empresa.pt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+351 912 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Construções Silva, Lda." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="companyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cliente *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Empresa">Empresa</SelectItem>
                      <SelectItem value="Profissional independente">Profissional independente</SelectItem>
                      <SelectItem value="Entidade pública">Entidade pública</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIF (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palavra-passe *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          {...field}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Palavra-passe *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme a senha"
                          {...field}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm">
                      Aceito os{" "}
                      <Link to="#" className="text-primary hover:underline">
                        Termos de Serviço
                      </Link>{" "}
                      e a{" "}
                      <Link to="#" className="text-primary hover:underline">
                        Política de Privacidade
                      </Link>
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full flex items-center gap-2" disabled={isSubmitting}>
              <UserPlus className="h-4 w-4" /> {isSubmitting ? "A criar..." : "Criar Conta"}
            </Button>
          </form>
        </Form>
        <div className="flex flex-col items-center space-y-2 mt-4">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
          <Link to="/modules" className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mt-4">
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;