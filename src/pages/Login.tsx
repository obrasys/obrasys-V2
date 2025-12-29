"use client";

import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .email("Formato de email inválido.")
    .min(1, "O email é obrigatório."),
  password: z.string().min(1, "A palavra-passe é obrigatória."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] =
    React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /* ------------------------------------------------------------------ */
  /* 🔐 SUBMIT — apenas autentica (sem redirects aqui)                   */
  /* ------------------------------------------------------------------ */
  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setNeedsEmailConfirmation(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        const msg = (error.message || "").toLowerCase();

        if (msg.includes("confirm")) {
          setNeedsEmailConfirmation(true);
          toast.error(
            "Email não confirmado. Verifique o seu email ou reenvie a confirmação."
          );
        } else if (msg.includes("invalid") || msg.includes("credentials")) {
          toast.error(
            "Credenciais inválidas. Verifique o e-mail e a palavra-passe."
          );
        } else {
          toast.error(`Erro ao iniciar sessão: ${error.message}`);
        }
        return;
      }

      // ❗ NÃO navegar aqui
      // O SessionContextProvider + ProtectedRoute tratam da navegação
      toast.success("Sessão iniciada com sucesso!");
    } catch (err: any) {
      toast.error(`Ocorreu um erro inesperado: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* 🔁 Reenvio de confirmação de email                                  */
  /* ------------------------------------------------------------------ */
  const handleResendConfirmation = async () => {
    const email = (form.getValues("email") || "").trim();
    if (!email) {
      toast.error("Insira o seu e-mail acima para reenviar a confirmação.");
      return;
    }

    const emailRedirectTo =
      import.meta.env.VITE_APP_BASE_URL ||
      window.location.origin;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });

    if (error) {
      toast.error(`Falha ao reenviar confirmação: ${error.message}`);
      return;
    }

    toast.success(
      "E-mail de confirmação reenviado! Verifique a sua caixa de entrada."
    );
    setNeedsEmailConfirmation(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-6">
        <div className="flex flex-col items-center">
          <img
            src="/marca_nav_bar.png"
            alt="Obra Sys Logo"
            className="h-12 mb-4"
          />
          <h1 className="text-2xl font-bold text-primary">
            Entrar na sua conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Aceda à sua conta para gerir as suas obras
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolu
