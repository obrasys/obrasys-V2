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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { profileSchema } from "@/schemas/profile-schema";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const personalProfileSchema = profileSchema.pick({
  first_name: true,
  last_name: true,
  phone: true,
  avatar_url: true,
});

type PersonalProfileFormValues = z.infer<typeof personalProfileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void; // Callback to refresh profile data in MainLayout
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onProfileUpdated }) => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<PersonalProfileFormValues>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      avatar_url: "",
    },
  });

  const currentAvatarUrl = form.watch("avatar_url");

  const fetchProfile = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, avatar_url, role, company_id') // Incluir company_id para consistência
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') { // No rows found, profile doesn't exist
        console.warn("No profile found for user, attempting to create a default one.");
        const newProfileData = {
          id: user.id,
          first_name: user.user_metadata.full_name?.split(' ')[0] || null,
          last_name: user.user_metadata.full_name?.split(' ').slice(1).join(' ') || null,
          phone: user.user_metadata.phone || null,
          role: 'cliente', // Default role
          company_id: user.user_metadata.company || null, // Usar 'company' do user_metadata
        };
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfileData);

        if (insertError) {
          console.error("Error creating default profile:", insertError);
          toast.error(`Erro ao criar perfil padrão: ${insertError.message}`);
          setIsLoading(false);
          return;
        } else {
          toast.info("Perfil padrão criado. Por favor, atualize os seus dados.");
          await fetchProfile(); // Recursive call
        }
      } else {
        console.error("Erro ao carregar perfil:", profileError);
        toast.error(`Erro ao carregar dados do perfil: ${profileError.message}`);
        setIsLoading(false);
      }
    } else if (profileData) {
      form.reset({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        phone: profileData.phone || "",
        avatar_url: profileData.avatar_url || "",
      });
      setAvatarPreview(profileData.avatar_url); // Set initial preview from DB
      setIsLoading(false);
    }
  }, [user, form]);

  React.useEffect(() => {
    if (!isSessionLoading && user && isOpen) { // Fetch when modal opens
      fetchProfile();
    }
  }, [user, isSessionLoading, isOpen, fetchProfile]);

  React.useEffect(() => {
    // Cleanup preview URL when component unmounts or file changes
    return () => {
      if (avatarPreview && avatarFile) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, avatarFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Formato de imagem inválido. Apenas JPG, PNG ou WEBP são permitidos.");
        setAvatarFile(null);
        setAvatarPreview(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("O tamanho da imagem excede o limite de 5MB.");
        setAvatarFile(null);
        setAvatarPreview(null);
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarFile(null);
      setAvatarPreview(form.getValues("avatar_url")); // Revert to current saved avatar
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    form.setValue("avatar_url", null); // Clear avatar_url in form
  };

  const onSubmit = async (data: PersonalProfileFormValues) => {
    if (!user) {
      toast.error("Utilizador não autenticado.");
      return;
    }
    setIsSaving(true);
    let newAvatarUrl = data.avatar_url;

    try {
      if (avatarFile) {
        setIsUploading(true);
        const fileExtension = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}/${uuidv4()}.${fileExtension}`; // Unique filename
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true,
            cacheControl: '3600',
          });

        if (uploadError) {
          throw new Error(`Erro ao carregar avatar: ${uploadError.message}`);
        }
        
        // Get public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        newAvatarUrl = publicUrlData.publicUrl;
        toast.success("Avatar carregado com sucesso!");
      } else if (data.avatar_url === null && currentAvatarUrl) {
        // If avatar was removed and there was a previous one, delete from storage
        const pathSegments = currentAvatarUrl.split('/');
        const fileName = pathSegments[pathSegments.length - 1];
        const folderPath = `avatars/${user.id}/`;
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([folderPath + fileName]); // Remove the specific file

        if (deleteError) {
          console.warn("Erro ao remover avatar antigo do storage:", deleteError.message);
          // Don't block save if old avatar deletion fails, just log a warning
        }
        newAvatarUrl = null;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          avatar_url: newAvatarUrl, // Use the new URL or null
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }
      toast.success("Perfil atualizado com sucesso!");
      onProfileUpdated(); // Notify parent to refresh profile data
      onClose();
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const userInitials = form.watch("first_name") && form.watch("last_name")
    ? `${form.watch("first_name").charAt(0)}${form.watch("last_name").charAt(0)}`.toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'US';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize as suas informações pessoais e foto de perfil.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} alt="Avatar do Utilizador" />
                <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <label htmlFor="avatar-upload" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
                  <Camera className="h-4 w-4 mr-2" /> Carregar foto
                  <input
                    id="avatar-upload"
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={isUploading || isSaving}
                  />
                </label>
                {(avatarPreview || currentAvatarUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRemoveAvatar}
                    disabled={isUploading || isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {isUploading && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A carregar avatar...
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primeiro Nome</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSaving || isUploading} />
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
                    <Input {...field} disabled={isSaving || isUploading} />
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
                    <Input {...field} disabled={isSaving || isUploading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A Guardar...
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