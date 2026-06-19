import { supabase } from "@/integrations/supabase/client";

export type NotificationSeverity = "info" | "warning" | "critical";
export type NotificationCategory =
  | "document_expiring"
  | "document_expired"
  | "evidence_pending"
  | "diagnostic_stale"
  | "new_association";

export interface AppNotification {
  key: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  description: string;
  createdAt: string;
  link?: { to: string; params?: Record<string, string> };
  read?: boolean;
}

const fmtDate = (v?: string | null) =>
  v ? new Date(`${v}${v.length === 10 ? "T12:00:00" : ""}`).toLocaleDateString("pt-BR") : "—";

const daysBetween = (target: string) => {
  const t = new Date(`${target}${target.length === 10 ? "T12:00:00" : ""}`).getTime();
  return Math.round((t - Date.now()) / (1000 * 60 * 60 * 24));
};

export async function loadNotifications(opts: {
  isAdmin: boolean;
  isConsultant: boolean;
  userId: string;
}): Promise<AppNotification[]> {
  if (!opts.isAdmin && !opts.isConsultant) return [];

  const [docsRes, assessRes, assocRes, readsRes] = await Promise.all([
    supabase
      .from("association_documents")
      .select("id, title, association_id, expires_at, associations(nome)")
      .not("expires_at", "is", null),
    supabase
      .from("association_assessments")
      .select("id, association_id, data_visita, evidence_validated, associations(nome)")
      .eq("evidence_validated", false)
      .order("data_visita", { ascending: false })
      .limit(50),
    supabase
      .from("associations")
      .select("id, nome, municipio, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("notification_reads").select("notification_key").eq("user_id", opts.userId),
  ]);

  const readKeys = new Set((readsRes.data ?? []).map((r) => r.notification_key));
  const list: AppNotification[] = [];

  // Document expirations
  (docsRes.data ?? []).forEach((d: any) => {
    if (!d.expires_at) return;
    const days = daysBetween(d.expires_at);
    const assoc = d.associations?.nome ?? "Associação";
    if (days < 0) {
      list.push({
        key: `doc-expired-${d.id}`,
        category: "document_expired",
        severity: "critical",
        title: `Documento vencido: ${d.title}`,
        description: `${assoc} — venceu em ${fmtDate(d.expires_at)} (há ${Math.abs(days)} dias)`,
        createdAt: d.expires_at,
        link: { to: "/admin/associacoes/$id/documentos", params: { id: d.association_id } },
      });
    } else if (days <= 30) {
      list.push({
        key: `doc-expiring-${d.id}`,
        category: "document_expiring",
        severity: days <= 7 ? "critical" : "warning",
        title: `Documento próximo do vencimento: ${d.title}`,
        description: `${assoc} — vence em ${fmtDate(d.expires_at)} (${days} dia${days === 1 ? "" : "s"})`,
        createdAt: d.expires_at,
        link: { to: "/admin/associacoes/$id/documentos", params: { id: d.association_id } },
      });
    }
  });

  // Evidence pending
  (assessRes.data ?? []).forEach((a: any) => {
    list.push({
      key: `evidence-${a.id}`,
      category: "evidence_pending",
      severity: "warning",
      title: "Evidências pendentes de validação",
      description: `${a.associations?.nome ?? "Associação"} — visita em ${fmtDate(a.data_visita)}`,
      createdAt: a.data_visita ?? new Date().toISOString(),
      link: {
        to: "/admin/associacoes/$id/diagnostico/$assessmentId",
        params: { id: a.association_id, assessmentId: a.id },
      },
    });
  });

  // Stale diagnostics (no assessment in >90 days)
  const assocIds = (assocRes.data ?? []).map((a: any) => a.id);
  if (assocIds.length > 0) {
    const { data: lastAssess } = await supabase
      .from("association_assessments")
      .select("association_id, data_visita")
      .in("association_id", assocIds)
      .order("data_visita", { ascending: false });
    const latestByAssoc = new Map<string, string>();
    (lastAssess ?? []).forEach((row: any) => {
      if (!latestByAssoc.has(row.association_id)) {
        latestByAssoc.set(row.association_id, row.data_visita);
      }
    });
    (assocRes.data ?? []).forEach((assoc: any) => {
      const last = latestByAssoc.get(assoc.id);
      const lastDays = last ? -daysBetween(last) : Infinity;
      if (lastDays > 90) {
        list.push({
          key: `stale-${assoc.id}`,
          category: "diagnostic_stale",
          severity: lastDays > 180 ? "critical" : "warning",
          title: "Diagnóstico em atraso",
          description: last
            ? `${assoc.nome} — último diagnóstico em ${fmtDate(last)} (há ${lastDays} dias)`
            : `${assoc.nome} — sem diagnóstico registrado`,
          createdAt: last ?? assoc.created_at,
          link: { to: "/admin/associacoes/$id", params: { id: assoc.id } },
        });
      }
    });
  }

  // New associations (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  (assocRes.data ?? []).forEach((assoc: any) => {
    if (new Date(assoc.created_at).getTime() >= weekAgo) {
      list.push({
        key: `new-assoc-${assoc.id}`,
        category: "new_association",
        severity: "info",
        title: "Nova associação cadastrada",
        description: `${assoc.nome}${assoc.municipio ? ` — ${assoc.municipio}` : ""}`,
        createdAt: assoc.created_at,
        link: { to: "/admin/associacoes/$id", params: { id: assoc.id } },
      });
    }
  });

  return list
    .map((n) => ({ ...n, read: readKeys.has(n.key) }))
    .sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      const sev = { critical: 0, warning: 1, info: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export async function markNotificationRead(userId: string, key: string) {
  await supabase
    .from("notification_reads")
    .upsert({ user_id: userId, notification_key: key }, { onConflict: "user_id,notification_key" });
}

export async function markAllRead(userId: string, keys: string[]) {
  if (keys.length === 0) return;
  await supabase
    .from("notification_reads")
    .upsert(
      keys.map((k) => ({ user_id: userId, notification_key: k })),
      { onConflict: "user_id,notification_key" },
    );
}
