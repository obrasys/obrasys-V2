"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Client, clientSchema } from "@/schemas/client-schema";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CreateEditClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  clientToEdit?: Client | null;
}

const CreateEditClientDialog: React.FC<CreateEditClientDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
}) => {
  const form = useForm<Client>({
    resolver: zodResolver(clientSchema),
    defaultValues: clientToEdit || {
      nome: "",
      nif: "",
      email: "",
      telefone: "",
      empresa: "",
      endereco: "",
      observacoes: "",
    },
  });

  React.useEffect(() => {
    if (clientToEdit) {
      form.reset(clientToEdit);
    } else {
      form.reset({
        nome: "",
        nif: "",
        email: "",
        telefone: "",
        empresa: "",
        endereco: "",
        observacoes: "",
      });
    }
  }, [clientToEdit, form]);

  const onSubmit = (data: Client) => {
    const newClient: Client = {
      ...data,
      id: data.id || uuidv4(), // Generate ID if new client
    };
    onSave(newClient);
    toast.success(`Cliente ${clientToEdit ? "atualizado" : "registado"} com sucesso!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh] p-0"> {/* Removido padding padrão */}
        <DialogHeader className="p-6 pb-4"> {/* Adicionado padding ao cabeçalho */}
          <DialogTitle>{clientToEdit ? "Editar Cliente" : "Registar Novo Cliente"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do cliente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow px-6 pb-6"> {/* Adicionado padding ao ScrollArea */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4"> {/* Removido py-4 */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome e Apelido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIF *</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(+351) 912 345 678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="empresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionais sobre o cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4"> {/* Adicionado pt-4 em vez de mt-4 */}
                <Button variant="outline" onClick={onClose} type="button">
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Cliente
                </Button>
              </div>
            </form>
          </Form>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditClientDialog;