"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarDays, PlusCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { RdoEntry } from "@/schemas/compliance-schema";
import { Project } from "@/schemas/project-schema";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";

const manualRdoEntrySchema = z.object({
  date: z.string().min(1, "A data é obrigatória."),
  description: z.string().min(1, "A descrição é obrigatória."),
  observations: z.string().optional().nullable(),
  attachments: z.any().optional(), // For file input
});

type ManualRdoEntryFormValues = z.infer<typeof manualRdoEntrySchema>;

interface ManualRdoEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rdo: RdoEntry) => void;
  projectId: string;
  companyId: string;
}

const ManualRdoEntryDialog: React.FC<ManualRdoEntryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  projectId,
  companyId,
}) => {
  const { user } = useSession();
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<FileList | null>(null);

  const form = useForm<ManualRdoEntryFormValues>({
    resolver: zodResolver(manualRdoEntrySchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      observations: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        observations: "",
      });
      setSelectedFiles(null);
    }
  }, [isOpen, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const onSubmit = async (data: ManualRdoEntryFormValues) => {
    if (!user) {
      toast.error("Utilizador não autenticado.");
      return;
    }
    setIsSaving(true);
    let attachments_url: string[] = [];

    try {
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadPromises = Array.from(selectedFiles).map(async (file) => {
          const fileExtension = file.name.split('.').pop();
          const filePath = `${projectId}/rdo_attachments/${uuidv4()}.${fileExtension}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('rdo_attachments') // Assuming a bucket named 'rdo_attachments' exists
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from('rdo_attachments')
            .getPublicUrl(filePath);

          if (!publicUrlData.publicUrl) throw new Error("Não foi possível obter o URL público do anexo.");
          return publicUrlData.publicUrl;
        });
        attachments_url = await Promise.all(uploadPromises);
        toast.success("Anexos carregados com sucesso!");
      }

      const newRdoEntry: RdoEntry = {
        id: uuidv4(),
        company_id: companyId,
        project_id: projectId,
        date: data.date,
        responsible_user_id: user.id,
        event_type: "manual_entry",
        description: data.description,
        observations: data.observations,
        attachments_url: attachments_url.length > 0 ? attachments_url : null,
        status: "pending", // Manual entries might need approval
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Call the onSave prop which will handle persistence to Supabase
      onSave(newRdoEntry);
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao adicionar registo manual: ${error.message}`);
      console.error("Erro ao adicionar registo manual:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Registo Manual (RDO)</DialogTitle>
          <DialogDescription>
            Adicione notas técnicas, ocorrências ou instruções à obra.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Registo *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSaving}
                        >
                          {field.value ? (
                            format(parseISO(field.value), "PPP", { locale: pt })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? parseISO(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        initialFocus
                        locale={pt}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Evento *</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={isSaving} placeholder="Ex: Reunião de coordenação com subempreiteiro de eletricidade." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={isSaving} placeholder="Notas importantes ou seguimento necessário." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Anexos (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSaving}
                />
              </FormControl>
              {selectedFiles && selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedFiles.length} ficheiro(s) selecionado(s).
                </p>
              )}
              <FormMessage />
            </FormItem>
            <Button type="submit" className="mt-4" disabled={isSaving}>
              {isSaving ? "A Guardar..." : "Adicionar Registo"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualRdoEntryDialog;