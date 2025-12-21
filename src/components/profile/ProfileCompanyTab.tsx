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
import { Building2, Camera } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Company, companySchema } from "@/schemas/profile-schema";
import { Skeleton } from "@/components/ui/skeleton";

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

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: "",
      nif: "",
      email: "",
      phone: "",
      address: "",
      logo_url: "",
    },
  });

  const fetchCompanyData = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // First, get the user's profile to find their company_id and role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') { // No rows found, profile doesn't exist
        // This case should ideally be handled by the Supabase trigger on signup.
        // If it's still null here, it means the trigger might not have run yet or failed.
        // We should not attempt to create it from the client to avoid conflicts.
        console.warn("No profile found for user. Assuming trigger will handle or profile is being created.");
        setCompanyId(null);
        setIsAdmin(false);
        form.reset(); // Reset form to empty values
      } else {
        console.error("Erro ao carregar perfil para company_id:", profileError);
        toast.error(`Erro ao carregar dados da empresa: ${profileError.message}`);
      }
      setIsLoading(false);
      return;
    }

    setCompanyId(profileData?.company_id || null);
    setIsAdmin(profileData?.role === 'admin');

    if (profileData?.company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profileData.company_id)
        .single();

      if (companyError) {
        console.error("Erro ao carregar dados da empresa:", companyError);
        toast.error(`Erro ao carregar dados da empresa: ${companyError.message}`);
      } else if (companyData) {
        form.reset({
          name: companyData.name || "",
          nif: companyData.nif || "",
          email: companyData.email || "",
          phone: companyData.phone || "",
          address: companyData.address || "",
          logo_url: companyData.logo_url || "",
        });
      }
    }
    setIsLoading(false);
  }, [user, form]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchCompanyData();
    }
  }, [user, isSessionLoading, fetchCompanyData]);

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
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          nif: data.nif,
          email: data.email,
          phone: data.phone,
          address: data.address,
          logo_url: data.logo_url,
        })
        .eq('id', companyId);

      if (error) {
        throw error;
      }
      toast.success("Dados da empresa atualizados com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar dados da empresa:", error);
      toast.error(`Erro ao atualizar dados da empresa: ${error.message}`);
    } finally {
      setIsSaving(false);
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
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
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
              <AvatarImage src={form.watch("logo_url") || undefined} alt="Logótipo da Empresa" />
              <AvatarFallback className="text-3xl">{companyInitials}</AvatarFallback>
            </Avatar>
            {/* Placeholder for logo upload */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background"
              disabled={!isAdmin} // Desabilitado se não for admin
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{form.watch("name")}</h3>
            <p className="text-sm text-muted-foreground">NIF: {form.watch("nif") || "N/A"}</p>
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
        <Button type="submit" disabled={isSaving || !isAdmin}>
          {isSaving ? "A Guardar..." : "Guardar Alterações"}
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