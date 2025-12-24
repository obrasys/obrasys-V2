"use client";

import React from "react";

interface InvoiceTotalDisplayProps {
  totalAmount: number;
}

const InvoiceTotalDisplay: React.FC<InvoiceTotalDisplayProps> = ({ totalAmount }) => {
  return (
    <div className="flex justify-end items-center gap-4 mt-6">
      <span className="text-lg font-semibold">Valor Total da Fatura:</span>
      <span className="text-2xl font-bold text-primary">{totalAmount.toFixed(2)} €</span>
    </div>
  );
};

export default InvoiceTotalDisplay;