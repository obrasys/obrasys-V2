"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Payment } from "@/schemas/invoicing-schema";

/* =========================
   SCHEMA CORRETO (INPUT)
========================= */

const paymentInputSchema = z.object({
  payment_date: z.string().min(1, "A data do pagamento é obrigatória."),
  amount: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  payment_method: z.enum(["bank_transfer", "cash", "card", "other"]),
  notes: z.string().optional().nullable(),
});

type PaymentInput = z.infer<typeof paymentInputSchema>;

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Payment) => void;
  invoiceId: string;
  maxAmount: number;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  invoiceId,
  maxAmount,
}) => {
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentInputSchema),
    defaultValues: {
      payment_date: format(new Date(), "yyyy-MM-dd"),
      amount: maxAmount > 0 ? maxAmount : 0,
      payment_method: "bank_transfer",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        payment_date: format(new Date(), "yyyy-MM-dd"),
        amount: maxAmount > 0 ? maxAmount : 0,
        payment_method: "bank_transfer",
        notes: "",
      });
    }
  }, [isOpen, maxAmount, form]);

  const onSubmit = async (data: PaymentInput) => {
    if (data.amount > maxAmount) {
      toast.error(
        `O valor do pagamento não pode exceder o valor pendente (${maxAmount.toFixed(
          2
        )} €).`
      );
      return;
    }

    setIsSaving(true);

    try {
      const paymentToSave: Payment = {
        invoice_id: invoiceId,
        payment_date: data.payment_date,
        amount: data.amount,
        payment_method: data.payment_method,
        notes: data.notes,
      };

      onSave(paymentToSave);
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao registar pagamento: ${error.message}`);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registar Pagamento</DialogTitle>
          <DialogDescription>
            Registe um pagamento para a fatura selecionada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            {/* DATA */}
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Pagamento *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSaving}
                        >
                          {field.value ? (
                            format(parseISO(field.value), "PPP", {
                              locale: pt,
                            })
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
                        selected={
                          field.value
                            ? parseISO(field.value)
                            : undefined
                        }
                        onSelect={(date) =>
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd") : ""
                          )
                        }
                        locale={pt}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* VALOR */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Pagamento *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      disabled={isSaving}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MÉTODO */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSaving}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bank_transfer">
                        Transferência Bancária
                      </SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NOTAS */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={isSaving} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                type="button"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A Guardar...
                  </>
                ) : (
                  "Registar Pagamento"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
