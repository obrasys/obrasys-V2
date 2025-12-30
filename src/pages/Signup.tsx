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

// --------------------
// Schema
// --------------------
const signupSchema = z.object({
  fullName: z.string().min(1, "O nome completo é obrigatório."),
  email: z.string().email("Formato de email inválido."),
  phone: z.string().min(1, "O telefone é obrigatório."),
  company: z.string().min(1, "O nome da empresa é obrigatório."),
  companyType: z.enum(
    ["Empresa", "Profissional independente", "Entidade pública"],
    { required_error: "O tipo de empresa é obrigatório." }
  ),
  nif: z.string().optional(),
  password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({
      message: "Deve aceitar os Termos de Serviço e a Política de Privacidade.",
    }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As palavras-passe não coincidem.",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

// --------------------
// Component
// --------------------
const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const emailRedirectTo =
    import.meta.env.VITE_APP_BASE_URL ?? "https://app.obrasys.pt";

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      company: "",
      companyType: "Empresa",
      nif: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase.auth.signUp({
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
          emailRedirectTo,
        },
      });

      if (error) {
        if ((error as any)?.status === 429) {
          toast.error("Muitas tentativas. Aguarde alguns segundos.");
        } else if (error.message?.toLowerCase().includes("already")) {
          toast.error("Este email já está registado.");
        } else {
          toast.error(`Erro ao registar: ${error.message}`);
        }
        return;
      }

      toast.success(
        "Registo efetuado com sucesso! Verifique o seu email para confirmar a conta."
      );
      navigate('/login');
    } catch (err: any) {
      toast.error(`Erro inesperado: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* UI mantida exatamente como tinhas */}
        {/* ... */}
      </div>
    </div>
  );
};

export default Signup;
