"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Download, FileText, RefreshCcw, Trash2 } from "lucide-react";

import { useSession } from "@/components/SessionContextProvider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { getReports, getSignedReportUrl, ReportHistoryRow } from "@/components/reports/api/getReports";
import { useReportGeneration, ReportType } from "@/hooks/use-report-generation";

export default function ReportsHistoryPage() {
  const { user } = useSession();
  const { userCompanyId, projects, handleGenerateReportClick } = useReportGeneration();

  const [month, setMonth] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<string | null>(null);

  const [rows, setRows] = useState<ReportHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const canLoad = Boolean(user && userCompanyId);

  const load = async () => {
    if (!canLoad) return;
    setLoading(true);
    try {
      const data = await getReports({
        companyId: userCompanyId!,
        projectId,
        reportType,
        month,
      });
      setRows(data);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCompanyId, projectId, reportType, month]);

  const empty = !loading && rows.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios Gerados</h1>
        <p className="text-muted-foreground">
          Histórico de relatórios PDF guardados no sistema.
        </p>
      </div>

      <Separator />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select onValueChange={(v) => setMonth(v || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Mês (YYYY-MM)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const v = format(d, "yyyy-MM");
              return <SelectItem key={v} value={v}>{v}</SelectItem>;
            })}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => setProjectId(v || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => setReportType(v || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de Relatório" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value={ReportType.INVOICES}>Faturas</SelectItem>
            <SelectItem value={ReportType.PROJECT_FINANCIAL}>Financeiro por Obra</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="secondary" onClick={load}>Atualizar</Button>
      </div>

      <Separator />

      {/* List */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {empty && (
        <div className="text-sm text-muted-foreground">
          Nenhum relatório encontrado para os filtros selecionados.
        </div>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between border rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">{r.report_title}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(r.created_at), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const url = await getSignedReportUrl(r.file_path);
                    window.open(url, "_blank");
                  } catch (e: any) {
                    toast.error(e.message || "Erro ao obter link");
                  }
                }}
              >
                <Download className="w-4 h-4 mr-1" />
                Abrir
              </Button>

              <Button
                size="sm"
                variant="ghost"
                title="Regerar"
                onClick={() =>
                  handleGenerateReportClick(
                    r.report_type as ReportType,
                    { month: format(new Date(r.created_at), "yyyy-MM") },
                    r.project_id
                  )
                }
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                title="Eliminar"
                onClick={() =>
                  toast.info("Eliminação pode ser ativada com policy + API.")
                }
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
