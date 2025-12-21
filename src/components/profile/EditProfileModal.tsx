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

  const currentAvatarUrlInForm = form.watch("avatar_url"); // Watch the current avatar_url in the form

  const fetchProfile = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    console.log("Fetching profile for user:", user.id);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, phone, avatar_url, role, company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') { // No rows found, profile doesn't exist
        console.warn("No profile found for user. Resetting form to empty values.");
        form.reset({
          first_name: "",
          last_name: "",
          phone: "",
          avatar_url: "",
        });
        setAvatarPreview(null);
      } else {
        console.error("Erro ao carregar perfil:", profileError);
        toast.error(`Erro ao carregar dados do perfil: ${profileError.message}`);
      }
      setIsLoading(false);
    } else if (profileData) {
      console.log("Profile data fetched:", profileData);
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
      console.log("File selected:", file.name, file.type, file.size);
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
      console.log("No file selected, reverting to previous avatar_url or null.");
      setAvatarFile(null);
      setAvatarPreview(currentAvatarUrlInForm); // Revert to current saved avatar if no new file
    }
  };

  const handleRemoveAvatar = () => {
    console.log("Removing avatar.");
    setAvatarFile(null);
    setAvatarPreview(null);
    form.setValue("avatar_url", null); // Clear avatar_url in form state
  };

  const onSubmit = async (data: PersonalProfileFormValues) => {
    if (!user) {
      toast.error("Utilizador não autenticado.");
      return;
    }
    setIsSaving(true);
    let finalAvatarUrl = data.avatar_url; // Start with current form value (could be existing URL or null if removed)
    console.log("Submitting form. Initial avatar_url:", finalAvatarUrl);

    try {
      // 1. Handle avatar file upload if a new file was selected
      if (avatarFile) {
        setIsUploading(true);
        const fileExtension = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}/${uuidv4()}.${fileExtension}`;
        console.log("Attempting to upload file to:", filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true, // Allows overwriting if a file with the same name exists (though uuidv4 makes it unique)
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error("Supabase Storage Upload Error:", uploadError);
          throw new Error(`Erro ao carregar avatar: ${uploadError.message}`);
        }
        console.log("Upload successful, data:", uploadData);

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        if (!publicUrlData.publicUrl) {
          throw new Error("Não foi possível obter o URL público do avatar.");
        }
        finalAvatarUrl = publicUrlData.publicUrl;
        toast.success("Avatar carregado com sucesso!");
        console.log("New avatar public URL:", finalAvatarUrl);

      } else if (data.avatar_url === null && currentAvatarUrlInForm) {
        // 2. Handle avatar removal if user explicitly cleared it and there was an old one
        console.log("Attempting to remove old avatar from storage. Current URL in form:", currentAvatarUrlInForm);
        
        // Extract the path relative to the bucket from the full public URL
        const urlParts = currentAvatarUrlInForm.split('/public/avatars/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1]; // e.g., user_id/file_name.png
          console.log("Storage path for deletion:", storagePath);
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([storagePath]);

          if (deleteError) {
            console.warn("Erro ao remover avatar antigo do storage:", deleteError.message);
            // Don't block save if old avatar deletion fails, just log a warning
          } else {
            console.log("Old avatar removed from storage successfully.");
          }
        } else {
          console.warn("Could not parse storage path from currentAvatarUrlInForm for deletion:", currentAvatarUrlInForm);
        }
        finalAvatarUrl = null; // Ensure avatar_url is null in DB
      }
      // If no new file and no removal, finalAvatarUrl remains data.avatar_url (which is the existing one from form)

      // 3. Update profile data in the database
      console.log("Attempting to update profile with data:", {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      });

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          avatar_url: finalAvatarUrl, // Use the new URL or null
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Supabase Profile Update Error:", updateError);
        throw updateError;
      }
      toast.success("Perfil atualizado com sucesso!");
      onProfileUpdated(); // Notify parent to refresh profile data
      onClose();
    } catch (error: any) {
      console.error("Erro geral ao atualizar perfil:", error);
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setAvatarFile(null); // Clear file input state after attempt
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
                {(avatarPreview || currentAvatarUrlInForm) && (
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