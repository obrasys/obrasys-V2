import { format, parseISO } from "date-fns";
import { generateCoverPage } from "./base-template";
import { AiAlert } from "@/schemas/ai-alert-schema";

export const generateAiAlertsReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { alerts } = reportData;

  return `
    ${generateCoverPage("Relatório de Alertas de IA", companyName, `Data de Geração: ${currentDate}`)}

    <h1>Relatório de Alertas de IA</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
    </div>
    <h2>Alertas Gerados pelo Assistente de IA</h2>
    ${alerts.length > 0 ? `
    <table>
        <thead>
            <tr>
                <th>Projeto</th>
                <th>Título</th>
                <th>Mensagem</th>
                <th>Severidade</th>
                <th>Data</th>
            </tr>
        </thead>
        <tbody>
            ${alerts.map((alert: AiAlert) => `
              <tr>
                <td>${alert.project_name || 'N/A'}</td>
                <td>${alert.title}</td>
                <td>${alert.message}</td>
                <td>${alert.severity?.replace('_', ' ') || 'N/A'}</td>
                <td>${alert.created_at ? format(parseISO(alert.created_at), "dd/MM/yyyy HH:mm") : 'N/A'}</td>
              </tr>
            `).join('')}
        </tbody>
    </table>
    ` : `<p style="text-align: center; margin-top: 20px; color: #777;">Nenhum alerta de IA encontrado.</p>`}
  `;
};