import { supabase } from "@/integrations/supabase/client";

export async function saveReportPdfToStorage(params: {
  html: string;
  companyId: string;
  reportType: string;
  reportTitle: string;
  projectId?: string | null;
  period?: { from?: string; to?: string };
}) {
  // 1️⃣ Converter HTML → PDF (browser)
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;
  iframeDoc.open();
  iframeDoc.write(params.html);
  iframeDoc.close();

  await new Promise((r) => setTimeout(r, 500));

  const pdfBlob = await iframe.contentWindow!.print?.();
  // ⚠️ NOTA:
  // browsers não retornam blob diretamente.
  // → no passo E substituímos por Playwright.
  // Aqui vamos salvar como HTML fallback.

  const fileName = `report-${params.reportType}-${Date.now()}.html`;
  const filePath = `${params.companyId}/${fileName}`;

  // 2️⃣ Upload
  const { data: upload, error: uploadError } =
    await supabase.storage
      .from("reports")
      .upload(filePath, new Blob([params.html], { type: "text/html" }), {
        upsert: false,
      });

  if (uploadError) throw uploadError;

  // 3️⃣ Histórico DB
  const { error: dbError } = await supabase
    .from("reports_history")
    .insert({
      company_id: params.companyId,
      project_id: params.projectId ?? null,
      report_type: params.reportType,
      report_title: params.reportTitle,
      period_start: params.period?.from ?? null,
      period_end: params.period?.to ?? null,
      file_path: upload.path,
      file_size: params.html.length,
    });

  if (dbError) throw dbError;

  return upload.path;
}
