import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

export const formatDate = (dateString: string | Date) => {
  if (!dateString) return "N/A";
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return format(date, "dd/MM/yyyy", { locale: pt });
};