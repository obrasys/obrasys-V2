import { supabase } from "@/integrations/supabase/client";

export type ReportHistoryRow = {
  id: string;
  company_id: string;
  project_id: string | null;
  report_type: string;
  report_title: string;
  period_start: string | null;
  period_end: string | null;
  file_path: string;
  file_size: number | null;
  created_at: string;
};

export async function getReports(params: {
  companyId: string;
  projectId?: string | null;
  reportType?: string | null;
  month?: string | null; // YYYY-MM
}) {
  let q = supabase
    .from("reports_history")
    .select("*")
    .eq("company_id", params.companyId)
    .order("created_at", { ascending: false });

  if (params.projectId) q = q.eq("project_id", params.projectId);
  if (params.reportType) q = q.eq("report_type", params.reportType);

  if (params.month) {
    const from = `${params.month}-01`;
    const to = `${params.month}-31`;
    q = q.gte("created_at", from).lte("created_at", to);
  }

  const { data, error } = await q;
  if (error) throw error;

  return data as ReportHistoryRow[];
}

export async function getSignedReportUrl(path: string) {
  const { data, error } = await supabase
    .storage
    .from("reports")
    .createSignedUrl(path, 60 * 15); // 15 min

  if (error) throw error;
  return data.signedUrl;
}
