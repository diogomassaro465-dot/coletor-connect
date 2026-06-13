import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, CheckCircle2, Clock3, FileDown, ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/diagnosticos")({
  head: () => ({ meta: [{ title: "Regularidade institucional — PROCATE" }] }),
  component: DiagnosticsDashboard,
});

const STATUS = { regular: "Regular", parcialmente_regular: "Parcialmente regular", irregular: "Irregular" } as const;

function DiagnosticsDashboard() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["diagnostics-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("association_assessments")
        .select("id,association_id,data_visita,consultant_name,status,regularity_index,regularity_compliant_count,regularity_total_count,evidence_validated,associations(nome,municipio)")
        .order("data_visita", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const total = data.length;
  const average = total ? data.reduce((sum, item) => sum + Number(item.regularity_index), 0) / total : 0;
  const completed = data.filter((item) => item.evidence_validated).length;
  const distribution = (Object.keys(STATUS) as Array<keyof typeof STATUS>).map((status) => ({ status, count: data.filter((item) => item.status === status).length }));

  async function exportDashboard() {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Regularidade");
    sheet.columns = [{ header: "Entidade", key: "entity", width: 40 }, { header: "Município", key: "city", width: 24 }, { header: "Visita", key: "date", width: 15 }, { header: "Índice (%)", key: "index", width: 14 }, { header: "Critérios", key: "criteria", width: 14 }, { header: "Status", key: "status", width: 22 }, { header: "Evidências", key: "evidence", width: 16 }];
    data.forEach((item) => sheet.addRow({ entity: item.associations?.nome ?? "—", city: item.associations?.municipio ?? "—", date: new Date(`${item.data_visita}T12:00:00`).toLocaleDateString("pt-BR"), index: Number(item.regularity_index), criteria: `${item.regularity_compliant_count}/${item.regularity_total_count}`, status: STATUS[item.status], evidence: item.evidence_validated ? "Validadas" : "Pendentes" }));
    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const link = document.createElement("a"); link.href = url; link.download = `regularidade-procate-${new Date().toISOString().slice(0, 10)}.xlsx`; link.click(); URL.revokeObjectURL(url);
  }

  return <AdminShell>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-7"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Diagnósticos institucionais</p><h1 className="mt-1 text-3xl font-bold">Índice de regularidade</h1><p className="mt-1 text-muted-foreground">Da entrevista validada às ações e relatórios consolidados.</p></div><Button variant="outline" onClick={exportDashboard} disabled={!total}><FileDown className="size-4" /> Exportar consolidado</Button></div>
    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Building2} label="Diagnósticos" value={total} /><Metric icon={BarChart3} label="Índice médio" value={`${average.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`} /><Metric icon={CheckCircle2} label="Fluxos concluídos" value={completed} /><Metric icon={Clock3} label="Evidências pendentes" value={total - completed} /></div>
    <section className="mb-9 grid gap-5 lg:grid-cols-[360px_1fr]"><div className="border-r border-border pr-0 lg:pr-7"><h2 className="font-semibold">Distribuição de status</h2><div className="mt-5 space-y-5">{distribution.map((item) => <div key={item.status}><div className="mb-1 flex justify-between text-sm"><span>{STATUS[item.status]}</span><strong>{item.count}</strong></div><progress className="h-2 w-full accent-primary" max={Math.max(total, 1)} value={item.count} aria-label={`${STATUS[item.status]}: ${item.count}`} /></div>)}</div></div><div><h2 className="font-semibold">Leitura operacional</h2><div className="mt-5 grid gap-3 sm:grid-cols-3"><Insight label="Regulares" value={distribution[0]?.count ?? 0} /><Insight label="Atenção parcial" value={distribution[1]?.count ?? 0} /><Insight label="Ação prioritária" value={distribution[2]?.count ?? 0} /></div><p className="mt-5 text-sm leading-relaxed text-muted-foreground">Use os registros irregulares como fila de ação prioritária; os parcialmente regulares indicam entidades com pelo menos metade dos critérios atendidos.</p></div></section>
    <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Diagnósticos recentes</h2><p className="text-sm text-muted-foreground">Acesse evidências, assinatura e relatório de cada visita.</p></div><Link to="/admin/associacoes"><Button variant="ghost">Ver associações</Button></Link></div>{isLoading ? <p className="py-10 text-center text-muted-foreground">Carregando indicadores...</p> : !total ? <div className="py-14 text-center"><ShieldAlert className="mx-auto mb-3 size-9 text-muted-foreground" /><p className="font-medium">Nenhum diagnóstico processado</p><p className="text-sm text-muted-foreground">Os indicadores aparecerão após a primeira entrevista.</p></div> : <div className="divide-y divide-border border-y border-border">{data.slice(0, 12).map((item) => <Link key={item.id} to="/admin/associacoes/$id/diagnostico/$assessmentId" params={{ id: item.association_id, assessmentId: item.id }} className="grid gap-3 py-4 transition hover:bg-muted/40 sm:grid-cols-[1fr_150px_180px_auto] sm:items-center"><div><p className="font-medium">{item.associations?.nome ?? "Entidade"}</p><p className="text-sm text-muted-foreground">{item.associations?.municipio} · {new Date(`${item.data_visita}T12:00:00`).toLocaleDateString("pt-BR")}</p></div><strong className="text-xl tabular-nums">{Number(item.regularity_index).toLocaleString("pt-BR")}%</strong><Badge variant="outline" className="w-fit">{STATUS[item.status]}</Badge><Badge variant={item.evidence_validated ? "secondary" : "outline"}>{item.evidence_validated ? "Concluído" : "Pendente"}</Badge></Link>)}</div>}</section>
  </AdminShell>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number | string }) { return <div className="flex items-center gap-4 border-b border-border pb-4"><div className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="size-5" /></div><div><p className="text-2xl font-bold tabular-nums">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></div>; }
function Insight({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-muted p-4"><p className="text-2xl font-bold tabular-nums">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>; }