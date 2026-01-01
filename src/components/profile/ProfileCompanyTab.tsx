"use client";

import React from "react";
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
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

/* =========================
   SCHEMA
========================= */

const companyProfileSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
});

type CompanyProfileFormValues = z.infer<
  typeof companyProfileSchema
>;

/* =========================
   COMPONENT
========================= */

const ProfileCompanyTab: React.FC = () => {
  const { user, profile, isLoading: isSessionLoading } =
    useSession();

  const [isLoading, setIsLoading] =
    React.useState(true);
  const [isSaving, setIsSaving] =
    React.useState(false);
  const [companyId, setCompanyId] =
    React.useState<string | null>(null);

  const form =
    useForm<CompanyProfileFormValues>({
      resolver: zodResolver(
        companyProfileSchema
      ),
      defaultValues: {
        name: "",
      },
    });

  /* =========================
     FETCH COMPANY (SÓ QUANDO HÁ company_id)
  ========================= */

  const fetchCompany = React.useCallback(
    async (companyId: string) => {
      setIsLoading(true);

      const { data, error } =
        await supabase
          .from("companies")
          .select("name")
          .eq("id", companyId)
          .single();

      if (error || !data) {
        toast.error(
          "Erro ao carregar empresa."
        );
        setIsLoading(false);
        return;
      }

      form.reset({
        name: data.name ?? "",
      });

      setIsLoading(false);
    },
    [form]
  );

  /* =========================
     EFFECT PRINCIPAL
  ========================= */

  React.useEffect(() => {
    if (isSessionLoading) return;

    if (!user || !profile) {
      setCompanyId(null);
      setIsLoading(false);
      return;
    }

    if (!profile.company_id) {
      // Estado válido: sem empresa
      setCompanyId(null);
      setIsLoading(false);
      return;
    }

    setCompanyId(profile.company_id);
    fetchCompany(profile.company_id);
  }, [
    isSessionLoading,
    user,
    profile,
    fetchCompany,
  ]);

  /* =========================
     CREATE COMPANY (RPC)
  ========================= */

  const handleCreateCompany =
    async () => {
      if (!user) return;

      const values = form.getValues();
      if (!values.name) {
        toast.error(
          "Informe o nome da empresa."
        );
        return;
      }

      setIsSaving(true);

      const { data, error } =
        await supabase.rpc(
          "create_company_and_assign_user",
          {
            p_name: values.name,
          }
        );

      console.log(
        "RPC RESULT:",
        data,
        error
      );

      if (error) {
        toast.error(
          error.message ||
            "Erro ao criar empresa."
        );
        setIsSaving(false);
        return;
      }

      toast.success("Empresa criada.");
      setIsSaving(false);
    };

  /* =========================
     UPDATE COMPANY
  ========================= */

  const onSubmit = async (
    data: CompanyProfileFormValues
  ) => {
    if (!companyId) {
      await handleCreateCompany();
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("companies")
      .update({
        name: data.name,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", companyId);

    if (error) {
      toast.error(
        error.message ||
          "Erro ao atualizar empresa."
      );
    } else {
      toast.success(
        "Empresa atualizada."
      );
    }

    setIsSaving(false);
  };

  /* =========================
     RENDER
  ========================= */

  if (isLoading || isSessionLoading) {
    return (
      <Skeleton className="h-32 w-full" />
    );
  }

  return (
    <>
      {/* 🔴 BOTÃO TEMPORÁRIO DE DEBUG (REMOVER DEPOIS) */}
      <Button
        type="button"
        variant="outline"
        className="mb-4"
        onClick={async () => {
          const { data, error } =
            await supabase.rpc(
              "create_company_and_assign_user",
              {
                p_name:
                  "Empresa Teste Debug",
              }
            );

          console.log(
            "RPC RESULT (DEBUG):",
            data,
            error
          );
        }}
      >
        TESTAR RPC (DEBUG)
      </Button>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nome da empresa
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Obra Sys Lda"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSaving}
          >
            {companyId
              ? "Guardar alterações"
              : "Criar empresa"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default ProfileCompanyTab;
