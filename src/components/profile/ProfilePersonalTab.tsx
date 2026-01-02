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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Camera } from "lucide-react";

import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Profile, profileSchema } from "@/schemas/profile-schema";
import { Skeleton } from "@/components/ui/skeleton";

/* =========================
   SCHEMA
========================= */

const personalProfileSchema = profileSchema.pick({
  first_name: true,
  last_name: true,
  phone: true,
  avatar_url: true,
});

type PersonalProfileFormValues = z.infer<
  typeof personalProfileSchema
>;

/* =========================
   COMPONENT
========================= */

const ProfilePersonalTab: React.FC = () => {
  const { user, isLoading: isSessionLoading } =
    useSession();

  const [isLoading, setIsLoading] =
    React.useState(true);
  const [isSaving, setIsSaving] =
    React.useState(false);
  const [profileData, setProfileData] =
    React.useState<Profile | null>(null);

  const form =
    useForm<PersonalProfileFormValues>({
      resolver: zodResolver(
        personalProfileSchema
      ),
      defaultValues: {
        first_name: "",
        last_name: "",
        phone: "",
        avatar_url: "",
      },
    });

  /* =========================
     FETCH PROFILE
  ========================= */

  const fetchProfile =
    React.useCallback(async () => {
      if (!user) {
        setProfileData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data, error } =
        await supabase
          .from("profiles")
          .select(
            "first_name, last_name, phone, avatar_url, role, plan_type"
          )
          .eq("id", user.id) // ✅ CORRETO
          .maybeSingle();

      if (error) {
        console.error(
          "[ProfilePersonalTab] fetch profile",
          error
        );
        toast.error(
          "Erro ao carregar dados do perfil."
        );
        setProfileData(null);
        setIsLoading(false);
        return;
      }

      if (data) {
        setProfileData(data as Profile);

        form.reset({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
        });
      }

      setIsLoading(false);
    }, [user, form]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchProfile();
    }
  }, [
    user,
    isSessionLoading,
    fetchProfile,
  ]);

  /* =========================
     SUBMIT
  ========================= */

  const onSubmit = async (
    data: PersonalProfileFormValues
  ) => {
    if (!user) {
      toast.error(
        "Utilizador não autenticado."
      );
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", user.id); // ✅ CORRETO

      if (error) throw error;

      toast.success(
        "Perfil atualizado com sucesso!"
      );
      await fetchProfile();
    } catch (error: any) {
      console.error(error);
      toast.error(
        `Erro ao atualizar perfil: ${error.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================
     LOADING
  ========================= */

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
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */

  const initials =
    profileData?.first_name &&
    profileData?.last_name
      ? `${profileData.first_name[0]}${profileData.last_name[0]}`.toUpperCase()
      : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={profileData?.avatar_url || undefined}
              />
              <AvatarFallback className="text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>

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
            <h3 className="text-lg font-semibold">
              {profileData?.first_name}{" "}
              {profileData?.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {user?.email}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {profileData?.role || "Cliente"}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              Plano:{" "}
              {profileData?.plan_type?.replace("_", " ") || "Trial"}
            </p>
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
            <Input value={user?.email || ""} disabled />
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

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "A Guardar..." : "Guardar Alterações"}
        </Button>
      </form>
    </Form>
  );
};

export default ProfilePersonalTab;
