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
import { Building2, Camera, Loader2, Trash2 } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Company, companySchema } from "@/schemas/profile-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const companyProfileSchema = companySchema.pick({
  name: true,
  nif: true,
  email: true,
  phone: true,
  address: true,
  logo_url: true,
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

const ProfileCompanyTab: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: "",
      nif: "",
      email: "",
      phone: "",
      address: "",
      logo_url: null,
    },
  });

  const currentLogoUrlInForm = form.watch("logo_url");

  const fetchCompanyData = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setCompanyId(null);
      setIsAdmin(false);
      form.reset();
      setLogoPreview(null);
      console.log("[ProfileCompanyTab] No user, resetting all company data.");
      return;
    }
    setIsLoading(true);
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.warn("No profile found for user. Assuming trigger will handle or profile is being created.");
      } else {
        console.error("[ProfileCompanyTab] Error fetching profile for company_id:", profileError);
        toast.error(`Erro ao carregar dados da empresa: ${profileError.message}`);
      }
      setCompanyId(null);
      setIsAdmin(false);
      form.reset();
      setLogoPreview(null);
      setIsLoading(false);
      return;
    }

    setCompanyId(profileData?.company_id || null);
    setIsAdmin(profileData?.role === 'admin');
    console.log("[ProfileCompanyTab] Fetched profile. Company ID:", profileData?.company_id, "Role:", profileData?.role);

    if (profileData?.company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profileData.company_id)
        .single();

      if (companyError) {
        console.error("[ProfileCompanyTab] Error fetching company data:", companyError);
        toast.error(`Erro ao carregar dados da empresa: ${companyError.message}`);
        form.reset();
        setLogoPreview(null);
      } else if (companyData) {
        console.log("[ProfileCompanyTab] Fetched company data:", companyData);
        form.reset({
          name: companyData.name || "",
          nif: companyData.nif || null,
          email: companyData.email || null,
          phone: companyData.phone || null,
          address: companyData.address || null,
          logo_url: companyData.logo_url || null,
        });
        setLogoPreview(companyData.logo_url);
        console.log("[ProfileCompanyTab] Form reset with logo_url:", companyData.logo_url);
        console.log("[ProfileCompanyTab] logoPreview set to:", companyData.logo_url);
      }
    } else {
      console.log("[ProfileCompanyTab] No company ID found for user, resetting form.");
      form.reset();
      setLogoPreview(null);
    }
    setIsLoading(false);
  }, [user, form]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchCompanyData();
    }
  }, [user, isSessionLoading, fetchCompanyData]);

  React.useEffect(() => {
    return () => {
      if (logoPreview && logoFile) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview, logoFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Formato de imagem inválido. Apenas JPG, PNG ou WEBP são permitidos.");
        setLogoFile(null);
        setLogoPreview(currentLogoUrlInForm);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("O tamanho da imagem excede o limite de 5MB.");
        setLogoFile(null);
        setLogoPreview(currentLogoUrlInForm);
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      setLogoPreview(currentLogoUrlInForm);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    form.setValue("logo_url", null);
  };

  const onSubmit = async (data: CompanyProfileFormValues) => {
    if (!user || !companyId) {
      toast.error("Utilizador não autenticado ou empresa não associada.");
      return;
    }
    if (!isAdmin) {
      toast.error("Não tem permissão para editar os dados da empresa.");
      return;
    }

    setIsSaving(true);
    let finalLogoUrl = data.logo_url;
    console.log("[ProfileCompanyTab] onSubmit: Initial finalLogoUrl from form:", finalLogoUrl);

    try {
      if (logoFile) {
        setIsUploading(true);
        const fileExtension = logoFile.name.split('.').pop();
        const filePath = `${companyId}/${uuidv4()}.${fileExtension}`;
        console.log("[ProfileCompanyTab] onSubmit: Uploading new logo to path:", filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(filePath, logoFile, {
            upsert: true,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error("[ProfileCompanyTab] onSubmit: Supabase Storage Upload Error:", uploadError);
          throw new Error(`Erro ao carregar logótipo: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('company-logos')
          .getPublicUrl(filePath);
        
        if (!publicUrlData.publicUrl) {
          console.error("[ProfileCompanyTab] onSubmit: Could not get public URL after upload.");
          throw new Error("Não foi possível obter o URL público do logótipo.");
        }
        finalLogoUrl = publicUrlData.publicUrl;
        toast.success("Logótipo carregado com sucesso!");
        console.log("[ProfileCompanyTab] onSubmit: New logo public URL:", finalLogoUrl);

      } else if (data.logo_url === null && currentLogoUrlInForm) {
        console.log("[ProfileCompanyTab] onSubmit: User requested to remove logo. Current URL:", currentLogoUrlInForm);
        const urlParts = currentLogoUrlInForm.split('/public/company-logos/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          console.log("[ProfileCompanyTab] onSubmit: Deleting old logo from storage path:", storagePath);
          const { error: deleteError } = await supabase.storage
            .from('company-logos')
            .remove([storagePath]);

          if (deleteError) {
            console.warn("[ProfileCompanyTab] onSubmit: Error removing old logo from storage:", deleteError.message);
          } else {
            console.log("[ProfileCompanyTab] onSubmit: Old logo removed from storage successfully.");
          }
        }
        finalLogoUrl = null;
      }

      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          nif: data.nif,
          email: data.email,
          phone: data.phone,
          address: data.address,
          logo_url: finalLogoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) {
        console.error("[ProfileCompanyTab] onSubmit: Supabase Company Update Error:", error);
        throw error;
      }
      toast.success("Dados da empresa atualizados com sucesso!");
      console.log("[ProfileCompanyTab] onSubmit: Company data updated in DB. Directly updating UI state.");
      // Directly update the form state and preview state for immediate visual feedback
      form.setValue('logo_url', finalLogoUrl);
      setLogoPreview(finalLogoUrl);
      // No need to call fetchCompanyData() here, as the state is already updated.
      // The useEffect will eventually re-fetch, ensuring consistency.
    } catch (error: any) {
      console.error("[ProfileCompanyTab] onSubmit: General error during company data update:", error);
      toast.error(`Erro ao atualizar dados da empresa: ${error.message}`);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setLogoFile(null);
      console.log("[ProfileCompanyTab] onSubmit: Finally block executed. isSaving:", isSaving, "isUploading:", isUploading, "logoFile:", logoFile);
    }
  };

  const companyInitials = form.watch("name")
    ? form.watch("name").split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'EM';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage key={logoPreview || 'default-company-logo'} src={logoPreview || undefined} alt="Logótipo da Empresa" />
              <AvatarFallback className="text-3xl">{companyInitials}</AvatarFallback>
            </Avatar>
            <label htmlFor="logo-upload" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background flex items-center justify-center border border-input cursor-pointer hover:bg-accent">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <input
                id="logo-upload"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={handleFileChange}
                className="sr-only"
                disabled={!isAdmin || isUploading || isSaving}
              />
            </label>
            {(logoPreview || currentLogoUrlInForm) && isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute bottom-0 right-8 h-8 w-8 rounded-full bg-background"
                onClick={handleRemoveLogo}
                disabled={!isAdmin || isUploading || isSaving}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{form.watch("name")}</h3>
            <p className="text-sm text-muted-foreground">NIF: {form.watch("nif") || "N/A"}</p>
            {isUploading && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar logótipo...
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Empresa</FormLabel>
              <FormControl>
                <Input {...field} disabled={!isAdmin} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIF da Empresa</FormLabel>
              <FormControl>
                <Input {...field} disabled={!isAdmin} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={!isAdmin} />
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
              <FormLabel>Email Geral</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled={!isAdmin} />
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
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input {...field} disabled={!isAdmin} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSaving || !isAdmin || isUploading}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A Guardar...
            </>
          ) : (
            "Guardar Alterações"
          )}
        </Button>
        {!isAdmin && (
          <p className="text-sm text-red-500 mt-2">
            Apenas administradores podem editar os dados da empresa.
          </p>
        )}
      </form>
    </Form>
  );
};

export default ProfileCompanyTab;