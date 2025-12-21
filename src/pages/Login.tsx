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
import { ArrowRight, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email("Formato de email inválido.").min(1, "O email é obrigatório."),
  password: z.string().min(1, "A palavra-passe é obrigatória."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(`Erro ao iniciar sessão: ${error.message}`);
      } else {
        toast.success('Sessão iniciada com sucesso!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(`Ocorreu um erro inesperado: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
      <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <img src="/marca_nav_bar.png" alt="Obra Sys Logo" className="h-10 sm:h-12 w-auto mb-2 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-primary dark:text-primary-foreground">
            Entrar na sua conta
          </h1>
          <p className="text-center text-muted-foreground text-sm">
            Aceda à sua conta para gerir as suas obras
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="email@exemplo.com" {...field} className="pl-10" />
                    </div>
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
                  <FormLabel>Palavra-passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="pl-10 pr-10"
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
            <Button type="submit" className="w-full flex items-center gap-2">
              Entrar <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Form>
        <div className="flex flex-col items-center space-y-2 mt-4">
          <Link to="/login" className="text-sm text-primary hover:underline">
            Esqueceu a palavra-passe?
          </Link>
          <p className="text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Criar conta
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

export default Login;