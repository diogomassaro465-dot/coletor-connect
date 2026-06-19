import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Beaker,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileDown,
  Bell,
  Upload,
  ArrowLeft,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { validateRow, type ImportRow } from "@/lib/catador-import";
import { buildAssociationReportPDF } from "@/lib/association-report";
import { loadNotifications, type AppNotification } from "@/lib/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/qa")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin && !context.isConsultant) {
      throw redirect({ to: "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "Painel de QA — PROCATE" }] }),
  component: QAPanel,
});

const SAMPLE_ROWS: Record<string, unknown>[] = [
  {
    nome_completo: "Maria da Silva (TESTE)",
    cpf: "529.982.247-25",
    rg_cin: "MG-12.345.678",
    genero: "feminino",
    autodeclaracao_racial: "Parda",
    escolaridade: "Ensino Fundamental Incompleto",
    endereco_completo: "Rua Teste, 100 — Centro",
    email: "maria.teste@exemplo.com",
    telefone: "(31) 99999-0000",
    renda_media_mensal: "1500,00",
    contribui_inss: "Sim",
    inscrito_cadunico: "Sim",
    possui_bolsa_familia: "Não",
    cadastro_gov_br: "Sim",
    nivel_cadastro_gov_br: "Prata",
    materiais_coletados: "Papelão; Plástico PET",
    possui_carroca: "Não",
    status: "pendente",
  },
  {
    nome_completo: "João CPF Inválido",
    cpf: "111.111.111-11",
    rg_cin: "SP-99.999",
    genero: "masculino",
    autodeclaracao_racial: "Preta",
    escolaridade: "Ensino Médio Completo",
    endereco_completo: "Av. Erro, 1",
    renda_media_mensal: "800",
    status: "pendente",
  },
  {
    nome_completo: "",
    cpf: "",
    rg_cin: "",
    genero: "outro",
    autodeclaracao_racial: "",
    escolaridade: "",
    endereco_completo: "",
    status: "pendente",
  },
];

function QAPanel() {
  const { isAdmin, isConsultant, user } = Route.useRouteContext();

  // Scenario 1: import
  const [importRows, setImportRows] = useState<ImportRow[] | null>(null);

  function runImportScenario() {
    const fakeAssoc = "00000000-0000-0000-0000-000000000000";
    const out = SAMPLE_ROWS.map((r, i) => validateRow(r, i + 2, fakeAssoc));
    setImportRows(out);
    const ok = out.filter((r) => r.errors.length === 0).length;
    toast.success(`Validação concluída: ${ok}/${out.length} válidas (dry-run, nada gravado).`);
  }

  // Scenario 2: PDF
  const [assocId, setAssocId] = useState<string>("");
  const [associations, setAssociations] = useState<{ id: string; nome: string }[]>([]);
  const [pdfBusy, setPdfBusy] = useState(false);

  async function loadAssocList() {
    if (associations.length) return;
    const { data, error } = await supabase
      .from("associations")
      .select("id, nome")
      .order("nome")
      .limit(100);
    if (error) toast.error(error.message);
    else setAssociations(data ?? []);
  }

  async function runPdfScenario() {
    if (!assocId) return toast.error("Selecione uma associação.");
    setPdfBusy(true);
    try {
      const [assocRes, asmRes, catRes, docRes] = await Promise.all([
        supabase.from("associations").select("*").eq("id", assocId).single(),
        supabase
          .from("association_assessments")
          .select("*")
          .eq("association_id", assocId)
          .order("data_visita", { ascending: false }),
        supabase.from("catadores").select("*").eq("association_id", assocId),
        supabase
          .from("association_documents")
          .select("*")
          .eq("association_id", assocId)
          .order("created_at", { ascending: false }),
      ]);
      if (assocRes.error) throw assocRes.error;
      buildAssociationReportPDF({
        association: assocRes.data,
        assessments: asmRes.data ?? [],
        catadores: catRes.data ?? [],
        documents: docRes.data ?? [],
      });
      toast.success("PDF gerado e baixado.");
    } catch (e) {
      toast.error("Falha ao gerar PDF", { description: (e as Error).message });
    } finally {
      setPdfBusy(false);
    }
  }

  // Scenario 3: notifications
  const [notifs, setNotifs] = useState<AppNotification[] | null>(null);
  const [notifBusy, setNotifBusy] = useState(false);

  async function runNotifScenario() {
    setNotifBusy(true);
    try {
      const list = await loadNotifications({ isAdmin, isConsultant, userId: user.id });
      setNotifs(list);
      toast.success(`${list.length} notificações carregadas.`);
    } catch (e) {
      toast.error("Falha ao carregar notificações", { description: (e as Error).message });
    } finally {
      setNotifBusy(false);
    }
  }

  const notifCounts = notifs
    ? {
        total: notifs.length,
        unread: notifs.filter((n) => !n.read).length,
        critical: notifs.filter((n) => n.severity === "critical").length,
        warning: notifs.filter((n) => n.severity === "warning").length,
        info: notifs.filter((n) => n.severity === "info").length,
        byCategory: notifs.reduce<Record<string, number>>((acc, n) => {
          acc[n.category] = (acc[n.category] ?? 0) + 1;
          return acc;
        }, {}),
      }
    : null;

  return (
    <AdminShell>
      <Link to="/admin">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="size-4" /> Voltar
        </Button>
      </Link>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">QA & testes</p>
        <h1 className="mt-1 text-3xl font-bold flex items-center gap-2">
          <Beaker className="size-7 text-primary" /> Painel de cenários de teste
        </h1>
        <p className="text-muted-foreground">
          Execute, passo a passo, validações de importação, geração de PDF e contagem de
          notificações. Nenhum cenário grava dados.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Import */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Upload className="size-4 text-primary" /> 1. Importação (dry-run)
              </h2>
              <p className="text-sm text-muted-foreground">
                Valida 3 linhas sintéticas (1 ok, 1 CPF inválido, 1 vazia). Não envia ao banco.
              </p>
            </div>
            <Button onClick={runImportScenario}>Executar</Button>
          </header>
          {importRows && (
            <ul className="space-y-2 text-sm">
              {importRows.map((r) => (
                <li
                  key={r.rowNumber}
                  className={`rounded-lg border p-3 ${
                    r.errors.length ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {r.errors.length === 0 ? (
                      <Badge variant="outline" className="bg-success/15 text-success border-success/30">
                        <CheckCircle2 className="size-3" /> OK
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">
                        <AlertCircle className="size-3" /> {r.errors.length} erro(s)
                      </Badge>
                    )}
                    Linha {r.rowNumber}: {String(r.raw["nome_completo"] || "(sem nome)")}
                  </div>
                  {r.errors.length > 0 && (
                    <ul className="mt-1 ml-2 list-disc pl-4 text-xs text-destructive">
                      {r.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 2. PDF */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <header className="mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileDown className="size-4 text-primary" /> 2. Geração de PDF
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecione uma associação real e baixe o relatório consolidado.
            </p>
          </header>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-64">
              <Select
                value={assocId}
                onValueChange={setAssocId}
                onOpenChange={(o) => o && loadAssocList()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a associação..." />
                </SelectTrigger>
                <SelectContent>
                  {associations.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runPdfScenario} disabled={!assocId || pdfBusy}>
              {pdfBusy ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
              Gerar PDF
            </Button>
          </div>
        </section>

        {/* 3. Notifications */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-card">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Bell className="size-4 text-primary" /> 3. Contagem de notificações
              </h2>
              <p className="text-sm text-muted-foreground">
                Roda o engine de notificações e exibe totais por severidade e categoria.
              </p>
            </div>
            <Button onClick={runNotifScenario} disabled={notifBusy}>
              {notifBusy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
              Executar
            </Button>
          </header>
          {notifCounts && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat label="Total" value={notifCounts.total} />
                <Stat label="Não lidas" value={notifCounts.unread} />
                <Stat label="Críticas" value={notifCounts.critical} tone="critical" />
                <Stat label="Atenção" value={notifCounts.warning} tone="warning" />
                <Stat label="Info" value={notifCounts.info} tone="info" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Por categoria
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(notifCounts.byCategory).map(([cat, n]) => (
                    <Badge key={cat} variant="secondary">
                      {cat}: {n}
                    </Badge>
                  ))}
                  {Object.keys(notifCounts.byCategory).length === 0 && (
                    <span className="text-sm text-muted-foreground">Nenhuma notificação ativa.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "muted" | "critical" | "warning" | "info";
}) {
  const tones = {
    muted: "bg-muted text-foreground",
    critical: "bg-destructive/15 text-destructive",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
    info: "bg-primary-soft text-primary",
  } as const;
  return (
    <div className={`rounded-xl p-4 ${tones[tone]}`}>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide">{label}</div>
    </div>
  );
}
