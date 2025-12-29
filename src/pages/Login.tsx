"use client";

import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { useSession } from "@/components/SessionContextProvider";

const loginSchema = z.object({
  email: z.string().email("Formato de email inválido."),
  password: z.string().min(1, "A palavra-passe é obrigatória."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading: isSessionLoading } = useSession();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = React.useState(false);

  // Se já existe sessão, redireciona
  React.useEffect(() => {
    if (!isSessionLoading && session) {
      navigate(from, { replace: true });
    }
  }, [session, isSessionLoading, navigate, from]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function signInWithTimeout(
    params: { email: string; password: string },
    ms = 12000
  ) {
    const timeout = new Promise<{ data: any; error: any }>((resolve) =>
      setTimeout(
        () =>
          resolve({
            data: null,
            error: new Error("Tempo excedido ao tentar entrar."),
          }),
        ms
      )
    );

    const request = supabase.auth.signInWithPassword(params);
    return Promise.race([request as any, timeout]);
  }

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      const { data: signInData, error } = await signInWithTimeout({
        email: data.email,
        password: data.password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        const needsConfirm = msg.includes("confirm");

        setNeedsEmailConfirmation(needsConfirm);

        if (needsConfirm) {
          toast.error("Email não confirmado.");
        } else {
          toast.error("Credenciais inválidas.");
        }
        return;
      }

      if (signInData?.session) {
        toast.success("Sessão iniciada com sucesso!");
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    const email = form.getValues("email");
    if (!email) {
      toast.error("Insira o e-mail primeiro.");
      return;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email de confirmação reenviado.");
      setNeedsEmailConfirmation(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <div className="text-center mb-6">
          <img
            src="/marca_nav_bar.png"
            alt="Obra Sys"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold">Entrar na sua conta</h1>
          <p className="text-sm text-muted-foreground">
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
                      <Input {...field} className="pl-10" />
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
                        {...field}
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>

        {needsEmailConfirmation && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={handleResendConfirmation}
          >
            Reenviar email de confirmação
          </Button>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/signup" className="text-primary hover:underline">
            Criar conta
          </Link>
          <br />
          <Link to="/modules" className="inline-flex items-center gap-1 mt-2">
            <ArrowLeft size={14} /> Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
