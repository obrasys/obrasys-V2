import React from "react";

interface InvoiceFiscalSummaryProps {
  subtotal: number;
  vatAmount: number;
  withholdingAmount: number;
  totalToReceive: number;
}

const InvoiceFiscalSummary: React.FC<InvoiceFiscalSummaryProps> = ({
  subtotal,
  vatAmount,
  withholdingAmount,
  totalToReceive,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">{subtotal?.toFixed(2)} €</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">IVA</span>
        <span className="font-medium">{vatAmount?.toFixed(2)} €</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Retenção</span>
        <span className="font-medium">{withholdingAmount?.toFixed(2)} €</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Total a Receber</span>
        <span className="font-semibold">{totalToReceive?.toFixed(2)} €</span>
      </div>
    </div>
  );
};

export default InvoiceFiscalSummary;