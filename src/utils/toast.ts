import { toast } from "sonner";

function sanitizeErrorMessage(message: string) {
  try {
    let m = message || "Ocorreu um erro.";
    // Remove UUIDs
    m = m.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "[id]");
    // Remove table names or technical keywords
    m = m.replace(/\b(budgets|projects|profiles|invoices|payments|subscriptions|rdo_entries|schedule_tasks)\b/gi, "dados");
    // Collapse whitespace/newlines
    m = m.replace(/\s+/g, " ").trim();
    // Truncate overly long messages
    if (m.length > 160) m = m.slice(0, 157) + "...";
    return m;
  } catch {
    return "Ocorreu um erro.";
  }
}

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(sanitizeErrorMessage(message));
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};