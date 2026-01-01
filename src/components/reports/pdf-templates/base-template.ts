/* base-template.ts
   ✅ Seguro (escape HTML)
   ✅ Preparado para PDF server-side (Puppeteer/Playwright)
   ✅ Mantém Red Hat Display
   ✅ Suporta capa opcional
*/

type BaseTemplateOptions = {
  title: string;
  companyName: string;
  content: string; // já deve vir em HTML (mas será sanitizado no nível básico)
  currentDate?: string;
  footerText?: string;

  /** Se true, inclui botões de print/close (apenas preview web) */
  includeWebControls?: boolean;

  /** HTML opcional de capa (use generateCoverPage) */
  coverHtml?: string | null;
};

const DEFAULT_FOOTER =
  "Documento gerado automaticamente pelo Obra Sys.";

/**
 * Escape básico para impedir injeção via strings simples.
 * NOTA: `content` normalmente é HTML gerado por templates internos.
 * Mesmo assim, para dados interpolados dentro do content, usa escapeHtml também.
 */
export function escapeHtml(input: unknown): string {
  const str = String(input ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Para conteúdo HTML gerado internamente:
 * - removemos <script> e handlers on* básicos (hardening leve)
 * Se quiseres sanitização forte, fazemos no passo seguinte (DOMPurify server-side).
 */
export function hardenHtml(html: unknown): string {
  const s = String(html ?? "");
  // remove scripts
  const noScript = s.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  // remove handlers onXXX="..."
  const noHandlers = noScript.replace(
    /\son\w+="[^"]*"/gi,
    ""
  );
  // remove handlers onXXX='...'
  return noHandlers.replace(/\son\w+='[^']*'/gi, "");
}

export const generateCoverPage = (
  reportTitle: string,
  companyName: string,
  periodInfo: string
) => `
  <div class="cover-page">
      <h1>${escapeHtml(reportTitle)}</h1>
      <p><strong>${escapeHtml(companyName)}</strong></p>
      <p>${escapeHtml(periodInfo)}</p>
  </div>
`;

/**
 * Template base para PDF (HTML completo).
 * Use includeWebControls apenas para preview em browser.
 */
export const generateBasePdfTemplate = (
  optsOrTitle: BaseTemplateOptions | string,
  companyName?: string,
  content?: string,
  currentDate?: string,
  footerText: string = DEFAULT_FOOTER
) => {
  // Compatibilidade com a tua assinatura antiga:
  // generateBasePdfTemplate(title, companyName, content, currentDate, footerText?)
  const opts: BaseTemplateOptions =
    typeof optsOrTitle === "string"
      ? {
          title: optsOrTitle,
          companyName: companyName ?? "",
          content: content ?? "",
          currentDate,
          footerText,
          includeWebControls: false,
          coverHtml: null,
        }
      : optsOrTitle;

  const safeTitle = escapeHtml(opts.title);
  const safeCompany = escapeHtml(opts.companyName);
  const safeFooter = escapeHtml(opts.footerText ?? DEFAULT_FOOTER);
  const safeDate = escapeHtml(
    opts.currentDate ??
      new Date().toISOString().slice(0, 10)
  );

  // content é HTML interno → hardening leve
  const safeContent = hardenHtml(opts.content);
  const cover = opts.coverHtml ? hardenHtml(opts.coverHtml) : "";

  const includeControls = Boolean(opts.includeWebControls);

  return `
  <!DOCTYPE html>
  <html lang="pt">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório: ${safeTitle}</title>
      <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
          /* Página A4 (ajusta se precisares) */
          @page {
            size: A4;
            margin: 20mm 16mm;
          }

          body {
            font-family: 'Red Hat Display', sans-serif;
            color: #333;
            line-height: 1.6;
          }

          h1 { color: #00679d; text-align: center; margin: 0 0 22px; }
          h2 { color: #00679d; border-bottom: 1px solid #eee; padding-bottom: 8px; margin: 26px 0 14px; }
          h3 { color: #00679d; margin: 18px 0 10px; }

          .header-info {
            margin-bottom: 18px;
            background-color: #f9f9f9;
            padding: 12px 14px;
            border-radius: 10px;
            border: 1px solid #eee;
          }
          .header-info p { margin: 6px 0; font-size: 0.95em; }

          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #d9d9d9; padding: 9px; text-align: left; vertical-align: top; }
          th { background-color: #f2f2f2; font-weight: 600; }

          .summary {
            margin-top: 18px;
            padding: 12px 14px;
            background-color: #e6f7ff;
            border-left: 5px solid #00679d;
            border-radius: 10px;
          }
          .summary p { margin: 4px 0; font-weight: 500; }

          .footer {
            margin-top: 26px;
            font-size: 0.75em;
            text-align: center;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 14px;
          }

          /* Para evitar cortes estranhos em PDF */
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .page-break { break-before: page; page-break-before: always; }

          /* Capa */
          .cover-page {
            text-align: center;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .cover-page h1 { font-size: 2.6em; margin-bottom: 14px; }
          .cover-page p { font-size: 1.2em; margin: 6px 0; }

          /* Controles só para preview web */
          .no-print {
            position: fixed;
            top: 18px;
            right: 18px;
            z-index: 1000;
          }
          @media print {
            .no-print { display: none; }
          }
      </style>
  </head>
  <body>
      ${
        includeControls
          ? `
      <div class="no-print">
        <button onclick="window.print()" style="padding: 10px 16px; background-color: #00679d; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px;">Imprimir</button>
        <button onclick="window.close()" style="padding: 10px 16px; background-color: #ddd; color: #333; border: none; border-radius: 6px; cursor: pointer;">Fechar</button>
      </div>
      `
          : ``
      }

      <!-- Header info opcional para todos os relatórios -->
      <div class="header-info avoid-break">
        <p><strong>Empresa:</strong> ${safeCompany}</p>
        <p><strong>Data:</strong> ${safeDate}</p>
        <p><strong>Relatório:</strong> ${safeTitle}</p>
      </div>

      ${cover ? `${cover}<div class="page-break"></div>` : ""}

      ${safeContent}

      <div class="footer">
          <p>${safeFooter}</p>
      </div>
  </body>
  </html>
`;
};
