import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";

export const generateProjectProgressReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { project, scheduleTasks, period } = reportData;
  const projectName = project?.nome || 'N/A';
  const clientName = project?.client_name || 'N/A';
  const totalPlannedCost = project?.custo_planeado || 0;
  const totalRealCost = project?.custo_real || 0;
  const deviation = totalRealCost - totalPlannedCost;

  return `
    ${generateCoverPage("Relatório de Progresso da Obra", companyName, `Projeto: ${projectName}<br>Período: ${period}`)}

    <h1>Relatório de Progresso da Obra</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Projeto / Obra:</strong> ${projectName}</p>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Período:</strong> ${period}</p>
    </div>
    <h2>Acompanhamento de Progresso Físico e Financeiro</h2>
    <table>
        <thead>
            <tr>
                <th>Fase / Capítulo</th>
                <th>Estado</th>
                <th style="text-align: right;">Progresso (%)</th>
                <th>Data Início</th>
                <th>Data Fim</th>
                <th>Duração (dias)</th>
            </tr>
        </thead>
        <tbody>
            ${scheduleTasks.map((task: any) => `
              <tr>
                <td>${task.capitulo}</td>
                <td>${task.estado}</td>
                <td style="text-align: right;">${task.progresso}%</td>
                <td>${task.data_inicio ? format(parseISO(task.data_inicio), "dd/MM/yyyy") : 'N/A'}</td>
                <td>${task.data_fim ? format(parseISO(task.data_fim), "dd/MM/yyyy") : 'N/A'}</td>
                <td style="text-align: right;">${task.duracao_dias || 'N/A'}</td>
              </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="summary">
        <p><strong>Progresso Geral da Obra:</strong> ${project?.progresso || 0}%</p>
        <p><strong>Custo Planeado:</strong> ${formatCurrency(totalPlannedCost)}</p>
        <p><strong>Custo Real:</strong> ${formatCurrency(totalRealCost)}</p>
        <p><strong>Desvio de Custos:</strong> ${formatCurrency(deviation)}</p>
    </div>
  `;
};