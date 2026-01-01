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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Camera,
  Loader2,
  Trash2,
} from "lucide-react";
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
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const COMPANY_TYPES = [
  "Empresa",
  "Profissional independente",
  "Entidade pública",
] as const;

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

type CompanyProfileFormValues = z.infer<
  typeof companyProfileSchema
>;

/* =========================
   COMPONENT
========================= */

const ProfileCompanyTab: React.FC = () => {
  const { user, isLoading: isSessionLoading } =
    useSession();

  const [isLoading, setIsLoading] =
    React.useState(true);
  const [isSaving, setIsSaving] =
    React.useState(false);
  const [isAdmin, setIsAdmin] =
    React.useState(false);
  const [companyId, setCompanyId] =
    React.useState<string | null>(null);
  const [logoFile, setLogoFile] =
    React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] =
    React.useState<string | null>(null);
  const [isUploading, setIsUploading] =
    React.useState(false);

  const form =
    useForm<CompanyProfileFormValues>({
      resolver: zodResolver(
        companyProfileSchema
      ),
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

  const persistedLogoUrl =
    form.watch("logo_url");

  /* =========================
     FETCH COMPANY
  ========================= */

  const fetchCompanyData =
    React.useCallback(async () => {
      if (!user) {
        setIsLoading(false);
        setCompanyId(null);
        setIsAdmin(false);
        form.reset();
        setLogoPreview(null);
        return;
      }

      setIsLoading(true);

      const { data: profile, error } =
        await supabase
          .from("profiles")
          .select("company_id, role")
          .eq("user_id", user.id) // ✅ CORRETO
          .single();

      if (error || !profile?.company_id) {
        toast.error(
          "Erro ao carregar dados da empresa."
        );
        setIsLoading(false);
        return;
      }

      setCompanyId(profile.company_id);
      setIsAdmin(profile.role === "admin");

      const {
        data: company,
        error: companyError,
      } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      if (companyError || !company) {
        toast.error(
          "Erro ao carregar dados da empresa."
        );
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
        company_type:
          COMPANY_TYPES.includes(
            company.company_type
          )
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
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  /* =========================
     FILE HANDLERS
  ========================= */

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      toast.error(
        "Formato de imagem inválido."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        "Imagem excede 5MB."
      );
      return;
    }

    setLogoFile(file);
    setLogoPreview(
      URL.createObjectURL(file)
    );
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    form.setValue("logo_url", null);
  };

  /* =========================
     SUBMIT
  ========================= */

  const onSubmit = async (
    data: CompanyProfileFormValues
  ) => {
    if (!user || !companyId) {
      toast.error(
        "Empresa não associada."
      );
      return;
    }

    if (!isAdmin) {
      toast.error(
        "Sem permissão para editar."
      );
      return;
    }

    setIsSaving(true);
    let finalLogoUrl =
      data.logo_url;

    try {
      if (logoFile) {
        setIsUploading(true);

        const ext =
          logoFile.name.split(".").pop();
        const path = `${companyId}/${uuidv4()}.${ext}`;

        const { error: uploadError } =
          await supabase.storage
            .from("company-logos")
            .upload(path, logoFile, {
              upsert: true,
            });

        if (uploadError) throw uploadError;

        const { data: urlData } =
          supabase.storage
            .from("company-logos")
            .getPublicUrl(path);

        finalLogoUrl =
          urlData.publicUrl;
      }

      if (
        data.company_type &&
        !COMPANY_TYPES.includes(
          data.company_type
        )
      ) {
        throw new Error(
          "Tipo de empresa inválido."
        );
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
          company_type:
            data.company_type,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", companyId);

      if (error) throw error;

      toast.success(
        "Empresa atualizada."
      );
      await fetchCompanyData();
    } catch (e: any) {
      toast.error(
        e.message ||
          "Erro ao atualizar empresa."
      );
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const companyInitials =
    form.watch("name")
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
    return (
      <Skeleton className="h-48 w-full" />
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* UI igual ao teu código original */}
        {/* … */}
      </form>
    </Form>
  );
};

export default ProfileCompanyTab;
