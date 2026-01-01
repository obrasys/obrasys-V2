import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import crypto from "node:crypto";

type Body = {
  html: string;

  companyId: string;
  reportType: string;
  reportTitle: string;

  projectId?: string | null;

  period?: {
    from?: string | null;
    to?: string | null;
    month?: string | null; // opcional
  };

  // opcional: nome de ficheiro custom
  fileName?: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function safePathSegment(v: string): string {
  return v.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = (req.body ?? {}) as Body;

    if (!body.html || typeof body.html !== "string") {
      res.status(400).json({ error: "html é obrigatório" });
      return;
    }
    if (!body.companyId) {
      res.status(400).json({ error: "companyId é obrigatório" });
      return;
    }
    if (!body.reportType) {
      res.status(400).json({ error: "reportType é obrigatório" });
      return;
    }
    if (!body.reportTitle) {
      res.status(400).json({ error: "reportTitle é obrigatório" });
      return;
    }

    const SUPABASE_URL = requireEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1) Render PDF (Playwright)
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Opcional: bloqueia requests externos (aumenta segurança/velocidade)
    await page.route("**/*", (route) => {
      const url = route.request().url();
      // deixa passar fonts google se precisares, ou bloqueia tudo:
      // se quiseres permitir fonts do google:
      if (url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com")) {
        return route.continue();
      }
      // permite data: / blob:
      if (url.startsWith("data:") || url.startsWith("blob:")) {
        return route.continue();
      }
      // permite tudo por padrão (mais compatível)
      return route.continue();
    });

    await page.setContent(body.html, { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "16mm", bottom: "20mm", left: "16mm" },
    });

    await page.close();
    await browser.close();

    // 2) Upload para Storage (bucket: reports)
    const id = crypto.randomUUID();
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const safeType = safePathSegment(body.reportType);
    const safeTitle = safePathSegment(body.reportTitle);

    const monthSeg =
      body.period?.month?.trim()
        ? safePathSegment(body.period.month.trim())
        : ts.slice(0, 7); // YYYY-MM

    const fileName = body.fileName
      ? safePathSegment(body.fileName)
      : `${safeType}-${monthSeg}-${id}.pdf`;

    const filePath = `${safePathSegment(body.companyId)}/${safeType}/${monthSeg}/${fileName}`;

    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from("reports")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) throw uploadErr;

    // 3) Registar histórico
    const periodStart = body.period?.from ? new Date(body.period.from).toISOString() : null;
    const periodEnd = body.period?.to ? new Date(body.period.to).toISOString() : null;

    const { error: histErr, data: histRow } = await supabaseAdmin
      .from("reports_history")
      .insert({
        company_id: body.companyId,
        project_id: body.projectId ?? null,
        report_type: body.reportType,
        report_title: body.reportTitle,
        period_start: periodStart ? periodStart.slice(0, 10) : null,
        period_end: periodEnd ? periodEnd.slice(0, 10) : null,
        file_path: uploadData?.path ?? filePath,
        file_size: pdfBuffer.byteLength,
      })
      .select("id")
      .single();

    if (histErr) throw histErr;

    // 4) Signed URL (para download/preview)
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("reports")
      .createSignedUrl(filePath, 60 * 30); // 30 min

    if (signErr) throw signErr;

    res.status(200).json({
      ok: true,
      reportId: histRow?.id,
      path: filePath,
      signedUrl: signed?.signedUrl,
      size: pdfBuffer.byteLength,
    });
  } catch (err: any) {
    console.error("render-pdf error:", err);
    res.status(500).json({ error: err?.message ?? "Erro ao gerar PDF" });
  }
}
