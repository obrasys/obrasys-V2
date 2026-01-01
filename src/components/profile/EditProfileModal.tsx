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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Camera,
  Trash2,
  Loader2,
} from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { profileSchema } from "@/schemas/profile-schema";
import { v4 as uuidv4 } from "uuid";

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

/* =========================
   SCHEMA (SEM PLAN_TYPE)
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

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

/* =========================
   COMPONENT
========================= */

const EditProfileModal: React.FC<
  EditProfileModalProps
> = ({ isOpen, onClose, onProfileUpdated }) => {
  const { user, isLoading: isSessionLoading } =
    useSession();

  const [isLoading, setIsLoading] =
    React.useState(true);
  const [isSaving, setIsSaving] =
    React.useState(false);
  const [avatarFile, setAvatarFile] =
    React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] =
    React.useState<string | null>(null);
  const [isUploading, setIsUploading] =
    React.useState(false);

  const form =
    useForm<PersonalProfileFormValues>({
      resolver: zodResolver(
        personalProfileSchema
      ),
      defaultValues: {
        first_name: "",
        last_name: "",
        phone: "",
        avatar_url: null,
      },
    });

  const currentAvatarUrl =
    form.watch("avatar_url");

  /* =========================
     FETCH PROFILE
  ========================= */

  const fetchProfile = React.useCallback(
    async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "first_name, last_name, phone, avatar_url"
        )
        .eq("user_id", user.id) // ✅ CORRETO
        .single();

      if (error) {
        toast.error(
          "Erro ao carregar perfil."
        );
        setIsLoading(false);
        return;
      }

      form.reset({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        avatar_url: data.avatar_url || null,
      });

      setAvatarPreview(data.avatar_url);
      setIsLoading(false);
    },
    [user, form]
  );

  React.useEffect(() => {
    if (
      isOpen &&
      user &&
      !isSessionLoading
    ) {
      fetchProfile();
    }
  }, [
    isOpen,
    user,
    isSessionLoading,
    fetchProfile,
  ]);

  React.useEffect(() => {
    return () => {
      if (avatarPreview && avatarFile) {
        URL.revokeObjectURL(
          avatarPreview
        );
      }
    };
  }, [avatarPreview, avatarFile]);

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

    setAvatarFile(file);
    setAvatarPreview(
      URL.createObjectURL(file)
    );
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    form.setValue("avatar_url", null);
  };

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
    let finalAvatarUrl =
      data.avatar_url;

    try {
      if (avatarFile) {
        setIsUploading(true);

        const ext =
          avatarFile.name.split(".").pop();
        const path = `${user.id}/${uuidv4()}.${ext}`;

        const { error: uploadError } =
          await supabase.storage
            .from("avatars")
            .upload(path, avatarFile, {
              upsert: true,
            });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } =
          supabase.storage
            .from("avatars")
            .getPublicUrl(path);

        finalAvatarUrl =
          urlData.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          avatar_url: finalAvatarUrl,
          updated_at:
            new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(
        "Perfil atualizado."
      );
      onProfileUpdated();
      onClose();
    } catch (e: any) {
      toast.error(
        e.message ||
          "Erro ao atualizar perfil."
      );
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setAvatarFile(null);
    }
  };

  const initials =
    form.watch("first_name") &&
    form.watch("last_name")
      ? `${form
          .watch("first_name")
          .charAt(0)}${form
          .watch("last_name")
          .charAt(0)}`.toUpperCase()
      : user?.email
          ?.charAt(0)
          .toUpperCase() || "U";

  /* =========================
     RENDER
  ========================= */

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Editar Perfil
          </DialogTitle>
          <DialogDescription>
            Atualize as suas informações
            pessoais.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              onSubmit
            )}
            className="space-y-6 py-4"
          >
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    avatarPreview ||
                    undefined
                  }
                />
                <AvatarFallback className="text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm border rounded px-3 py-2">
                  <Camera className="h-4 w-4" />
                  Carregar foto
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(
                      ","
                    )}
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={
                      isSaving ||
                      isUploading
                    }
                  />
                </label>

                {(avatarPreview ||
                  currentAvatarUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={
                      handleRemoveAvatar
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isUploading && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A carregar avatar…
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Primeiro Nome
                  </FormLabel>
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
                  <FormLabel>
                    Último Nome
                  </FormLabel>
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
                <Input
                  value={
                    user?.email || ""
                  }
                  disabled
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar…
                </>
              ) : (
                "Guardar Alterações"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
