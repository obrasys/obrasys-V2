"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";

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
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { Client, clientSchema } from "@/schemas/client-schema";
import { toast } from "sonner";

interface CreateEditClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  clientToEdit?: Client | null;
}

const emptyClient: Client = {
  id: "",
  nome: "",
  nif: "",
  email: "",
  telefone: "",
  empresa: "",
  endereco: "",
  observacoes: "",
};

const CreateEditClientDialog: React.FC<CreateEditClientDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
}) => {
  const form = useForm<Client>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyClient,
    mode: "onBlur",
  });

  /* =========================
     RESET CONTROLADO
  ========================= */

  useEffect(() => {
    if (isOpen) {
      form.reset(clientToEdit ?? emptyClient);
    }
  }, [isOpen, clientToEdit, form]);

  /* =========================
     SUBMIT
  ========================= */

  const onSubmit = (data: Client) => {
    const client: Client = {
      ...data,
      id: data.id || uuidv4(),
    };

    onSave(client);

    toast.success(
      clientToEdit
        ? "Cliente atualizado com sucesso!"
        : "Cliente registado com sucesso!"
    );

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>
            {clientToEdit
              ? "Editar Cliente"
              : "Registar Novo Cliente"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4"
            >
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoFocus
                        placeholder="Nome e apelido"
                      />
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
                        <Input
                          {...field}
                          placeholder="123456789"
                        />
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
                        <Input
                          {...field}
                          placeholder="(+351) 912 345 678"
                        />
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
                      <Input
                        {...field}
                        type="email"
                        placeholder="email@exemplo.com"
                      />
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
                    <FormLabel>
                      Empresa (opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome da empresa"
                      />
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
                      <Textarea
                        {...field}
                        placeholder="Endereço completo"
                      />
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
                    <FormLabel>
                      Observações
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Notas adicionais"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
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
