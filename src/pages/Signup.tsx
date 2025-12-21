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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define o schema de validação para o formulário de cadastro
const signupSchema = z.object({
  fullName: z.string().min(1, "O nome completo é obrigatório."),
  email: z.string().email("Formato de email inválido.").min(1, "O email é obrigatório."),
  phone: z.string().min(1, "O telefone é obrigatório."),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string().min(1, "Confirme a sua palavra-passe."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As palavras-passe não coincidem.",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    // Simulação de cadastro ou integração futura com Supabase
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
        },
      });

      if (error) {
        toast.error(`Erro ao registar: ${error.message}`);
      } else {
        toast.success('Registo efetuado com sucesso! Verifique o seu email para confirmar a conta.');
        navigate('/login'); // Redireciona para o login após o registo
      }
    } catch (error: any) {
      toast.error(`Ocorreu um erro inesperado: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src="/marca_nav_bar.png" alt="Obra Sys Logo" className="h-12 w-auto mb-4" />
          <h1 className="text-3xl font-bold text-center text-primary dark:text-primary-foreground">
            Criar Conta
          </h1>
          <p className="text-center text-muted-foreground text-sm">
            Registe-se para começar a usar o Obra Sys
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome e Apelido" {...field} />
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
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone *</FormLabel>
                  <FormControl>
                    <Input placeholder="(+351) 912 345 678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Palavra-passe *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Criar Conta
            </Button>
          </form>
        </Form>
        <div className="flex flex-col items-center space-y-2 mt-4">
          <Link to="/login" className="text-sm text-primary hover:underline">
            Já tem uma conta? Entrar
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;