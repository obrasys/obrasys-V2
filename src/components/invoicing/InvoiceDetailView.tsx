"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  PlusCircle,
  Loader2,
} from "lucide-react";
import {
  InvoiceWithRelations,
  InvoiceItem,
  Payment,
} from "@/schemas/invoicing-schema";
import {
  formatCurrency,
  formatDate,
} from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/components/SessionContextProvider";
import PaymentDialog from "./PaymentDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { v4 as uuidv4 } from "uuid";
import { Company } from "@/schemas/profile-schema";

/* =========================
   COMPONENT
========================= */

interface InvoiceDetailViewProps {
  invoice: InvoiceWithRelations;
  onInvoiceUpdated: () => void;
  onEditInvoice: (invoice: InvoiceWithRelations) => void;
}

const InvoiceDetailView: React.FC<
  InvoiceDetailViewProps
> = ({ invoice, onInvoiceUpdated, onEditInvoice }) => {
  const { user } = useSession();

  const [isLoadingDetails, setIsLoadingDetails] =
    React.useState(true);
  const [isProcessingAction, setIsProcessingAction] =
    React.useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] =
    React.useState(false);

  const [invoiceItems, setInvoiceItems] =
    React.useState<InvoiceItem[]>([]);
  const [payments, setPayments] =
    React.useState<Payment[]>([]);
  const [companyData, setCompanyData] =
    React.useState<Company | null>(null);

  /* =========================
     FETCH DETAILS
  ========================= */

  const fetchInvoiceDetails = React.useCallback(
    async () => {
      setIsLoadingDetails(true);

      const [itemsRes, paymentsRes] =
        await Promise.all([
          supabase
            .from("invoice_items")
            .select("*")
            .eq("invoice_id", invoice.id),
          supabase
            .from("payments")
            .select("*")
            .eq("invoice_id", invoice.id)
            .order("payment_date", {
              ascending: true,
            }),
        ]);

      if (itemsRes.error) {
        console.error(
          "[InvoiceDetailView] items",
          itemsRes.error
        );
        toast.error(
          "Erro ao carregar itens da fatura"
        );
        setInvoiceItems([]);
      } else {
        setInvoiceItems(itemsRes.data || []);
      }

      if (paymentsRes.error) {
        console.error(
          "[InvoiceDetailView] payments",
          paymentsRes.error
        );
        toast.error(
          "Erro ao carregar pagamentos"
        );
        setPayments([]);
      } else {
        setPayments(paymentsRes.data || []);
      }

      if (invoice.company_id) {
        const { data, error } =
          await supabase
            .from("companies")
            .select("*")
            .eq("id", invoice.company_id)
            .maybeSingle();

        if (error) {
          console.error(
            "[InvoiceDetailView] company",
            error
          );
          setCompanyData(null);
        } else {
          setCompanyData(data);
        }
      } else {
        setCompanyData(null);
      }

      setIsLoadingDetails(false);
    },
    [invoice.id, invoice.company_id]
  );

  React.useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  /* =========================
     ACTIONS
  ========================= */

  const handleRecordPayment = async (
    payment: Payment
  ) => {
    if (!user || !invoice.company_id) {
      toast.error(
        "Utilizador não autenticado ou empresa inválida."
      );
      return;
    }

    setIsProcessingAction(true);

    const paymentData = {
      ...payment,
      id: uuidv4(),
      company_id: invoice.company_id,
      invoice_id: invoice.id,
    };

    const { error: paymentError } =
      await supabase
        .from("payments")
        .insert(paymentData);

    if (paymentError) {
      console.error(
        "[InvoiceDetailView] payment insert",
        paymentError
      );
      toast.error(
        "Erro ao registar pagamento"
      );
      setIsProcessingAction(false);
      return;
    }

    const newPaidAmount =
      (invoice.paid_amount || 0) +
      payment.amount;

    let newStatus = invoice.status;
    if (newPaidAmount >= invoice.total_amount) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "pending";
    }

    const { error: updateError } =
      await supabase
        .from("invoices")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

    if (updateError) {
      console.error(
        "[InvoiceDetailView] invoice update",
        updateError
      );
      toast.error(
        "Erro ao atualizar estado da fatura"
      );
      setIsProcessingAction(false);
      return;
    }

    toast.success(
      "Pagamento registado com sucesso"
    );
    setIsPaymentDialogOpen(false);
    onInvoiceUpdated();
    fetchInvoiceDetails();

    setIsProcessingAction(false);
  };

  const handleUpdateInvoiceStatus = async (
    newStatus: InvoiceWithRelations["status"]
  ) => {
    if (!user || !invoice.id) {
      toast.error(
        "Utilizador não autenticado ou fatura inválida."
      );
      return;
    }

    setIsProcessingAction(true);

    const { error } = await supabase
      .from("invoices")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (error) {
      console.error(
        "[InvoiceDetailView] status update",
        error
      );
      toast.error(
        "Erro ao atualizar estado da fatura"
      );
      setIsProcessingAction(false);
      return;
    }

    toast.success(
      `Estado atualizado para '${newStatus.replace(
        "_",
        " "
      )}'`
    );
    onInvoiceUpdated();
    setIsProcessingAction(false);
  };

  /* =========================
     UI HELPERS
  ========================= */

  const getStatusBadge = (
    status: InvoiceWithRelations["status"]
  ) => {
    let variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline" = "secondary";
    let colorClass = "";
    let icon = null;

    switch (status) {
      case "pending":
        variant = "outline";
        colorClass =
          "border-orange-500 text-orange-600";
        icon = (
          <Clock className="h-3 w-3 mr-1" />
        );
        break;
      case "paid":
        variant = "default";
        colorClass =
          "bg-green-500 text-white";
        icon = (
          <CheckCircle className="h-3 w-3 mr-1" />
        );
        break;
      case "overdue":
      case "cancelled":
        variant = "destructive";
        icon = (
          <XCircle className="h-3 w-3 mr-1" />
        );
        break;
    }

    return (
      <Badge
        variant={variant}
        className={cn("w-fit", colorClass)}
      >
        {icon} {status.replace("_", " ")}
      </Badge>
    );
  };

  const remainingAmount =
    invoice.total_amount -
    (invoice.paid_amount || 0);
  const isFullyPaid = remainingAmount <= 0;

  /* =========================
     RENDER
  ========================= */

  if (isLoadingDetails) {
    return confirmskeleton();
  }

  function confirmskeleton() {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Fatura Nº {invoice.invoice_number}
        </CardTitle>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => onEditInvoice(invoice)}
            disabled={isProcessingAction}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>

          {!isFullyPaid &&
            invoice.status !== "cancelled" && (
              <Button
                onClick={() =>
                  setIsPaymentDialogOpen(true)
                }
                disabled={isProcessingAction}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Registar Pagamento
              </Button>
            )}

          {invoice.status === "pending" && (
            <Button
              variant="destructive"
              onClick={() =>
                handleUpdateInvoiceStatus(
                  "cancelled"
                )
              }
              disabled={isProcessingAction}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <strong>Cliente:</strong>{" "}
            {invoice.clients?.nome || "N/A"}
          </div>
          <div>
            <strong>Obra:</strong>{" "}
            {invoice.projects?.nome || "N/A"}
          </div>
          <div>
            <strong>Emissão:</strong>{" "}
            {formatDate(invoice.issue_date)}
          </div>
          <div>
            <strong>Vencimento:</strong>{" "}
            {formatDate(invoice.due_date)}
          </div>
          <div>
            <strong>Estado:</strong>{" "}
            {getStatusBadge(invoice.status)}
          </div>
          <div>
            <strong>Total:</strong>{" "}
            {formatCurrency(
              invoice.total_amount
            )}
          </div>
        </div>

        <Separator />

        <h3 className="font-semibold">
          Pagamentos
        </h3>

        {payments.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum pagamento registado.
          </p>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className="flex justify-between text-sm"
            >
              <span>
                {formatDate(p.payment_date)}
              </span>
              <span>
                {formatCurrency(p.amount)}
              </span>
            </div>
          ))
        )}
      </CardContent>

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() =>
          setIsPaymentDialogOpen(false)
        }
        onSave={handleRecordPayment}
        invoiceId={invoice.id || ""}
        maxAmount={remainingAmount}
      />
    </Card>
  );
};

export default InvoiceDetailView;
