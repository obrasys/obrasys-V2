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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { companySchema } from "@/schemas/profile-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { v4 as uuidv4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* =========================
   CONFIG
========================= */

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const COMPANY_TYPES = ["Empresa", "Profissional independente", "Entidade pública"] as const;

/* =========================
   SCHEMA
========================= */

const companyProfileSchema = companySchema.pick({
  name: true,
  nif: true,
  email: true,
  phone: true,
  address: true,
  logo_url: true,
  company_type: true,
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

/* =========================
   COMPONENT
========================= */

const ProfileCompanyTab: React.FC = () => {
  const { user, isLoading: isSessionLoading, profile } = useSession();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [companyId, setCompanyId] = React.useState<string | null>(null);

  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // Estado para criar empresa quando ainda não existe
  const [isCreatingCompany, setIsCreatingCompany] = React.useState(false);

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: "",
      nif: "",
      email: "",
      phone: "",
      address: "",
      logo_url: null,
      company_type: "Empresa",
    },
  });

  const persistedLogoUrl = form.watch("logo_url");

  /* =========================
     FETCH COMPANY
  ========================= */

  const fetchCompanyData = React.useCallback(async () => {
    // Espera auth estabilizar
    if (!user) {
      setCompanyId(null);
      setIsAdmin(false);
      form.reset();
      setLogoPreview(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // ✅ CORREÇÃO: profiles usa "id" (não user_id)
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, company_id, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Erro ao carregar profile (empresa):", profileError);
      toast.error("Erro ao carregar o seu perfil.");
      setCompanyId(null);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    // role/admin
    setIsAdmin(profileRow?.role === "admin");

    // ✅ Sem company_id NÃO é erro. É onboarding pendente.
    if (!profileRow?.company_id) {
      setCompanyId(null);
      form.reset({
        name: "",
        nif: "",
        email: "",
        phone: "",
        address: "",
        logo_url: null,
        company_type: "Empresa",
      });
      setLogoPreview(null);
      setIsLoading(false);
      return;
    }

    setCompanyId(profileRow.company_id);

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profileRow.company_id)
      .single();

    if (companyError || !company) {
      console.error("Erro ao carregar company:", companyError);
      toast.error("Erro ao carregar dados da empresa.");
      setIsLoading(false);
      return;
    }

    form.reset({
      name: company.name || "",
      nif: company.nif || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      logo_url: company.logo_url || null,
      company_type: COMPANY_TYPES.includes(company.company_type)
        ? company.company_type
        : "Empresa",
    });

    setLogoPreview(null);
    setIsLoading(false);
  }, [user, form]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchCompanyData();
    }
  }, [isSessionLoading, fetchCompanyData]);

  React.useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  /* =========================
     FILE HANDLERS
  ========================= */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Formato de imagem inválido.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Imagem excede 5MB.");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    form.setValue("logo_url", null);
  };

  /* =========================
     CREATE COMPANY (EXPLÍCITO)
  ========================= */

  const handleCreateCompany = async () => {
    if (!user) return;

    // Pode exigir admin para criar; ajusta conforme tua regra.
    // Se quiseres permitir qualquer user criar a primeira empresa, remove esta verificação.
    // if (!isAdmin) { toast.error("Sem permissão para criar empresa."); return; }

    // Validar campos mínimos para criação
    const current = form.getValues();
    if (!current.name?.trim()) {
      toast.error("Indique o nome da empresa.");
      return;
    }

    setIsCreatingCompany(true);

    try {
      // OPÇÃO 1 (RECOMENDADA): RPC transacional cria company + associa no profile
      // 👉 Tens de ter esta RPC criada no DB
      const { error: rpcError } = await supabase.rpc("create_company_and_assign_user", {
        p_name: current.name,
        p_nif: current.nif,
        p_email: current.email,
        p_phone: current.phone,
        p_address: current.address,
        p_company_type: current.company_type,
      });

      if (rpcError) {
        // Se não existir RPC ainda, vai falhar aqui — nesse caso usa a OPÇÃO 2 abaixo.
        throw rpcError;
      }

      toast.success("Empresa criada.");
      await fetchCompanyData();
    } catch (err: any) {
      console.error("Erro ao criar empresa:", err);

      // OPÇÃO 2 (fallback): criação direta (só funciona se RLS permitir e houver policies adequadas)
      // Se preferires esta via, comenta a OPÇÃO 1 e deixa apenas esta.
      toast.error(
        err?.message ||
          "Não foi possível criar a empresa. Se ainda não existe a RPC, precisamos criá-la no Supabase."
      );
    } finally {
      setIsCreatingCompany(false);
    }
  };

  /* =========================
     SUBMIT (UPDATE COMPANY)
  ========================= */

  const onSubmit = async (data: CompanyProfileFormValues) => {
    if (!user) {
      toast.error("Sessão inválida.");
      return;
    }

    if (!companyId) {
      // Se não há companyId, este submit deve criar empresa, não atualizar.
      await handleCreateCompany();
      return;
    }

    if (!isAdmin) {
      toast.error("Sem permissão para editar.");
      return;
    }

    setIsSaving(true);
    let finalLogoUrl = data.logo_url;

    try {
      if (logoFile) {
        setIsUploading(true);

        const ext = logoFile.name.split(".").pop();
        const path = `${companyId}/${uuidv4()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(path, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("company-logos")
          .getPublicUrl(path);

        finalLogoUrl = urlData.publicUrl;
      }

      if (data.company_type && !COMPANY_TYPES.includes(data.company_type)) {
        throw new Error("Tipo de empresa inválido.");
      }

      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          nif: data.nif,
          email: data.email,
          phone: data.phone,
          address: data.address,
          logo_url: finalLogoUrl,
          company_type: data.company_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companyId);

      if (error) throw error;

      toast.success("Empresa atualizada.");
      await fetchCompanyData();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar empresa.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const companyInitials = form.watch("name")
    ? form
        .watch("name")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "EM";

  /* =========================
     RENDER
  ========================= */

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const hasCompany = !!companyId;

  return (
  <>
    {/* 🔴 BOTÃO TEMPORÁRIO DE DEBUG — REMOVER DEPOIS */}
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        const { data, error } = await supabase.rpc(
          "create_company_and_assign_user",
          {
            p_name: "Empresa Teste Frontend",
          }
        );

        console.log("RPC RESULT:", data, error);
      }}
      className="mb-4"
    >
      TESTAR RPC (DEBUG)
    </Button>

    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* TODO: UI original */}
      </form>
    </Form>
  </>
);

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ✅ Estado sem empresa: onboarding explícito */}
        {!hasCompany && (
          <div className="rounded-md border p-4 space-y-3">
            <div className="text-sm">
              <strong>Sem empresa associada.</strong>
              <div className="text-muted-foreground">
                Preencha o nome e clique em <em>Criar empresa</em> para começar.
              </div>
            </div>

            <Button
              type="button"
              onClick={handleCreateCompany}
              disabled={isCreatingCompany || !user}
            >
              {isCreatingCompany ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A criar...
                </>
              ) : (
                "Criar empresa"
              )}
            </Button>
          </div>
        )}

        {/* UI restante igual ao teu original */}
        {/* Exemplo mínimo de campos (mantém os teus) */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da empresa</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Obra Sys Lda" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ... mantém os restantes campos/Select/Avatar etc do teu UI original ... */}

        <Button
          type="submit"
          disabled={isSaving || isUploading || (!hasCompany && isCreatingCompany)}
        >
          {(isSaving || isUploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {hasCompany ? "Guardar alterações" : "Criar empresa"}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileCompanyTab;