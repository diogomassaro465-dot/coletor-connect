import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, ClipboardPlus, MapPin, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/associacoes/$id/")({
  head: () => ({ meta: [{ title: "Detalhes da associação — PROCATE" }] }),
  component: AssociationDetails,
});

const STATUS_LABEL = { regular: "Regular", parcialmente_regular: "Parcialmente regular", irregular: "Irregular" } as const;

function AssociationDetails() {
  const { id } = Route.useParams();
  const { data: association, isLoading } = useQuery({
    queryKey: ["association", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("associations").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: assessments = [] } = useQuery({
    queryKey: ["association-assessments", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("association_assessments").select("id,data_visita,horario_visita,consultant_name,status,created_at").eq("association_id", id).order("data_visita", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <AdminShell><p className="text-muted-foreground">Carregando...</p></AdminShell>;
  if (!association) return <AdminShell><p>Entidade não encontrada.</p></AdminShell>;

  return (
    <AdminShell>
      <Link to="/admin/associacoes"><Button variant="ghost" size="sm" className="mb-5"><ArrowLeft className="size-4" /> Voltar às entidades</Button></Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5 border-b border-border pb-8">
        <div>
          <div className="mb-3 flex items-center gap-2"><Badge variant="secondary">{association.tipo === "formal" ? "Formal" : "Informal"}</Badge><Badge variant={association.ativa ? "outline" : "secondary"}>{association.ativa ? "Ativa" : "Inativa"}</Badge></div>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight">{association.nome}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-4" /> {association.municipio}</p>
        </div>
        <Link to="/admin/associacoes/$id/diagnostico/novo" params={{ id }}><Button size="lg"><ClipboardPlus className="size-4" /> Novo diagnóstico</Button></Link>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Info label="Associados no início" value={association.numero_associados_inicial} icon={Users} />
        <Info label="Associados atualmente" value={association.numero_associados_atual} icon={Users} />
        <Info label="Diagnósticos realizados" value={assessments.length} icon={CalendarDays} />
      </div>

      <section>
        <h2 className="text-xl font-semibold">Histórico de diagnósticos</h2>
        <p className="mt-1 text-sm text-muted-foreground">Cada visita mantém seu próprio retrato institucional.</p>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {assessments.length === 0 ? <p className="py-10 text-center text-muted-foreground">Nenhum diagnóstico realizado.</p> : assessments.map((item) => (
            <Link key={item.id} to="/admin/associacoes/$id/diagnostico/$assessmentId" params={{ id, assessmentId: item.id }} className="flex flex-wrap items-center justify-between gap-4 py-4 transition hover:bg-muted/40">
              <div><p className="font-medium">Visita de {new Date(`${item.data_visita}T12:00:00`).toLocaleDateString("pt-BR")}</p><p className="text-sm text-muted-foreground">Consultor(a): {item.consultant_name}</p></div>
              <Badge variant="outline" className={item.status === "regular" ? "border-success/40 text-success" : item.status === "irregular" ? "border-destructive/40 text-destructive" : "border-warning/50 text-warning-foreground"}>{STATUS_LABEL[item.status]}</Badge>
            </Link>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card"><div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="size-5" /></div><div><p className="text-2xl font-bold tabular-nums">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></div>;
}