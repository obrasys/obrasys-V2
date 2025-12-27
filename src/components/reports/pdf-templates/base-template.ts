export const generateBasePdfTemplate = (title: string, companyName: string, content: string, currentDate: string, footerText: string = "Documento gerado automaticamente pelo Obra Sys.") => `
  <!DOCTYPE html>
  <html lang="pt">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório: ${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
          body { font-family: 'Red Hat Display', sans-serif; margin: 40px; color: #333; line-height: 1.6; }
          h1 { color: #00679d; text-align: center; margin-bottom: 30px; }
          h2 { color: #00679d; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px; margin-bottom: 20px; }
          h3 { color: #00679d; margin-top: 30px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: 600; }
          .header-info { margin-bottom: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
          .header-info p { margin: 8px 0; font-size: 0.95em; }
          .summary { margin-top: 30px; padding: 15px; background-color: #e6f7ff; border-left: 5px solid #00679d; border-radius: 8px; }
          .summary p { margin: 5px 0; font-weight: 500; }
          .footer { margin-top: 50px; font-size: 0.75em; text-align: center; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
          .no-print { position: fixed; top: 20px; right: 20px; z-index: 1000; }
          .cover-page { text-align: center; page-break-after: always; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; }
          .cover-page h1 { font-size: 3em; margin-bottom: 20px; }
          .cover-page p { font-size: 1.5em; margin-bottom: 10px; }
          @media print {
              .no-print { display: none; }
          }
      </style>
  </head>
  <body>
      <div class="no-print">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #00679d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Imprimir</button>
        <button onclick="window.close()" style="padding: 10px 20px; background-color: #ccc; color: #333; border: none; border-radius: 5px; cursor: pointer;">Fechar</button>
      </div>
      ${content}
      <div class="footer">
          <p>${footerText}</p>
      </div>
  </body>
  </html>
`;

export const generateCoverPage = (reportTitle: string, companyName: string, periodInfo: string) => `
  <div class="cover-page">
      <h1>${reportTitle}</h1>
      <p><strong>${companyName}</strong></p>
      <p>${periodInfo}</p>
  </div>
`;