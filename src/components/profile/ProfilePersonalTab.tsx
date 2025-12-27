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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile, profileSchema } from "@/schemas/profile-schema";
import { Skeleton } from "@/components/ui/skeleton";

const personalProfileSchema = profileSchema.pick({
  first_name: true,
  last_name: true,
  phone: true,
  avatar_url: true, // Manter para exibir, mas não para upload aqui
  plan_type: true, // NEW: plan_type
});

type PersonalProfileFormValues = z.infer<typeof personalProfileSchema>;

const ProfilePersonalTab: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [profileData, setProfileData] = React.useState<Profile | null>(null); // Estado para armazenar o perfil completo

  const form = useForm<PersonalProfileFormValues>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      avatar_url: "",
      plan_type: "trialing", // Default value
    },
  });

  const fetchProfile = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setProfileData(null);
      return;
    }
    setIsLoading(true);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, avatar_url, role, company_id, plan_type') // Fetch plan_type
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') { // No rows found, profile doesn't exist
        // This case should ideally be handled by the Supabase trigger on signup.
        // If it's still null here, it means the trigger might not have run yet or failed.
        // We should not attempt to create it from the client to avoid conflicts.
        console.warn("No profile found for user. Assuming trigger will handle or profile is being created.");
        setProfileData(null); // Set profile to null, UI should handle loading/empty state
        form.reset({ // Reset form to empty values
          first_name: "",
          last_name: "",
          phone: "",
          avatar_url: "",
          plan_type: "trialing", // Default value
        });
      } else {
        console.error("Erro ao carregar perfil:", profileError);
        toast.error(`Erro ao carregar dados do perfil: ${profileError.message}`);
        setProfileData(null);
      }
      setIsLoading(false);
    } else if (profileData) {
      setProfileData(profileData); // Armazena o perfil completo
      form.reset({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        phone: profileData.phone || "",
        avatar_url: profileData.avatar_url || "",
        plan_type: profileData.plan_type || "trialing", // Set plan_type
      });
      setIsLoading(false);
    }
  }, [user, form]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchProfile();
    }
  }, [user, isSessionLoading, fetchProfile]);

  const onSubmit = async (data: PersonalProfileFormValues) => {
    if (!user) {
      toast.error("Utilizador não autenticado.");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          // avatar_url não é atualizado aqui, é feito no modal
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = profileData?.first_name && profileData?.last_name
    ? `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(0)}`.toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'US';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
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
              <AvatarImage src={profileData?.avatar_url || undefined} alt="Avatar do Utilizador" />
              <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
            </Avatar>
            {/* Botão de upload desabilitado aqui, pois o upload é feito no modal */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background"
              disabled
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{profileData?.first_name} {profileData?.last_name}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground capitalize">{profileData?.role || "Cliente"}</p>
            <p className="text-sm text-muted-foreground capitalize">Plano: {profileData?.plan_type?.replace('_', ' ') || "Trialing"}</p> {/* Display plan type */}
          </div>
        </div>

        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primeiro Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Último Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input value={user?.email || ""} readOnly disabled />
          </FormControl>
        </FormItem>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Cargo / Função</FormLabel>
          <FormControl>
            <Input value={profileData?.role || "Cliente"} readOnly disabled className="capitalize" />
          </FormControl>
        </FormItem>
        <FormItem>
          <FormLabel>Plano Atual</FormLabel>
          <FormControl>
            <Input value={profileData?.plan_type?.replace('_', ' ') || "Trialing"} readOnly disabled className="capitalize" />
          </FormControl>
        </FormItem>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "A Guardar..." : "Guardar Alterações"}
        </Button>
      </form>
    </Form>
  );
};

export default ProfilePersonalTab;