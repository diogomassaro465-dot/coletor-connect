import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Pencil, Trash2, ChevronDown, Check, Info, History } from "lucide-react";
import { toast } from "sonner";
import { GENERO_LABEL, STATUS_OPTIONS, STATUS_LABEL, STATUS_DESCRIPTION } from "@/lib/catador-constants";

export const Route = createFileRoute("/_authenticated/admin/$id/")({
  head: () => ({ meta: [{ title: "Detalhes — RecicladoresBR" }] }),
  component: CatadorDetails,
});

function CatadorDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: c, isLoading } = useQuery({
    queryKey: ["catador", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("catadores").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("catadores")
        .update({ status: status as "ativo" | "inativo" | "pendente" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["catador", id] });
      qc.invalidateQueries({ queryKey: ["catadores"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("catadores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cadastro excluído.");
      qc.invalidateQueries({ queryKey: ["catadores"] });
      navigate({ to: "/admin" });
    },
  });

  if (isLoading) {
    return <AdminShell><p className="text-muted-foreground">Carregando...</p></AdminShell>;
  }
  if (!c) {
    return <AdminShell><p>Catador não encontrado.</p></AdminShell>;
  }

  return (
    <AdminShell>
      <Link to="/admin">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="size-4" /> Voltar
        </Button>
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{c.nome_completo}</h1>
            <StatusPill status={c.status} />
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Sobre o status ${STATUS_LABEL[c.status] ?? c.status}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Info className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  {STATUS_DESCRIPTION[c.status] ?? "Sem descrição."}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground mt-1">
            Cadastrado em {new Date(c.data_cadastro).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Status <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Alterar status do cadastro
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((s) => {
                const isCurrent = c.status === s.value;
                return (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => !isCurrent && statusMutation.mutate(s.value)}
                    className="flex items-start gap-2 py-2"
                  >
                    <Check
                      className={`size-4 mt-0.5 shrink-0 ${isCurrent ? "text-primary" : "opacity-0"}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {s.label} {isCurrent && <span className="text-xs text-muted-foreground">(atual)</span>}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {STATUS_DESCRIPTION[s.value]}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/admin/$id/editar" params={{ id }}>
            <Button variant="outline"><Pencil className="size-4" /> Editar</Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir cadastro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. O cadastro de <strong>{c.nome_completo}</strong> será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Identificação">
          <Field k="CPF" v={c.cpf} />
          <Field k="RG / CIN" v={c.rg_cin} />
          <Field k="Gênero" v={GENERO_LABEL[c.genero] ?? c.genero} />
          <Field k="Autodeclaração racial" v={c.autodeclaracao_racial} />
          <Field k="Escolaridade" v={c.escolaridade} />
          <Field k="Cooperativa / Grupo" v={c.nome_cooperativa ?? "—"} />
        </Section>

        <Section title="Contato">
          <Field k="E-mail" v={c.email ?? "—"} />
          <Field k="Telefone" v={c.telefone ?? "—"} />
          <Field k="Endereço" v={c.endereco_completo} />
        </Section>

        <Section title="Documentação">
          <Field k="Título de Eleitor" v={c.titulo_eleitor ?? "—"} />
          <Field k="CTPS" v={c.ctps ?? "—"} />
          <Field k="NIS" v={c.nis ?? "—"} />
        </Section>

        <Section title="Socioeconômico">
          <Field k="Renda média mensal" v={`R$ ${Number(c.renda_media_mensal).toFixed(2)}`} />
          <Field k="Contribui com INSS" v={c.contribui_inss ? "Sim" : "Não"} />
          <Field k="CadÚnico" v={c.inscrito_cadunico ? "Sim" : "Não"} />
          <Field k="Bolsa Família" v={c.possui_bolsa_familia ? "Sim" : "Não"} />
          <Field k="Conta bancária digital" v={c.conta_bancaria_digital ?? "—"} />
          <Field k="Cadastro gov.br" v={c.cadastro_gov_br ? `Sim (${c.nivel_cadastro_gov_br ?? "—"})` : "Não"} />
        </Section>

        <Section title="Coleta" className="lg:col-span-2">
          <Field k="Materiais coletados" v={
            <div className="flex flex-wrap gap-1.5">
              {(c.materiais_coletados as string[]).map((m: string) => (
                <Badge key={m} variant="secondary">{m}</Badge>
              ))}
            </div>
          } />
          <Field k="Possui carroça" v={c.possui_carroca ? `Sim (${c.tipo_carroca ?? "—"})` : "Não"} />
          <Field k="Área de atuação" v={c.area_atuacao ?? "—"} />
        </Section>

        <Section title="Documentos anexados" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DocPreview label="Comprovante de residência" path={c.comprovante_residencia_url} />
            <DocPreview label="CPF" path={c.cpf_foto_url} />
            <DocPreview label="RG / CIN" path={c.rg_cin_foto_url} />
            <DocPreview label="Título de Eleitor" path={c.titulo_eleitor_foto_url} />
            <DocPreview label="CTPS" path={c.ctps_foto_url} />
            <DocPreview label="NIS" path={c.nis_foto_url} />
          </div>
        </Section>
      </div>
    </AdminShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ativo: "bg-success/15 text-success border-success/30",
    pendente: "bg-warning/20 text-warning-foreground border-warning/40",
    inativo: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{STATUS_LABEL[status] ?? status}</Badge>;
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-xl border border-border shadow-card p-6 ${className}`}>
      <h2 className="font-semibold text-primary mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 text-sm">
      <div className="text-muted-foreground">{k}</div>
      <div className="sm:col-span-2 font-medium break-words">{v}</div>
    </div>
  );
}

function DocPreview({ label, path }: { label: string; path: string | null }) {
  const { data: url } = useQuery({
    queryKey: ["doc-url", path],
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from("catadores-docs")
        .createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!path,
  });

  const isPdf = !!path && path.toLowerCase().endsWith(".pdf");

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-muted/30">
      <div className="px-3 py-2 text-xs font-medium border-b border-border bg-card">{label}</div>
      {!path ? (
        <div className="aspect-[4/3] grid place-items-center text-xs text-muted-foreground">Não anexado</div>
      ) : !url ? (
        <div className="aspect-[4/3] grid place-items-center text-xs text-muted-foreground">Carregando...</div>
      ) : isPdf ? (
        <a href={url} target="_blank" rel="noreferrer" className="aspect-[4/3] grid place-items-center text-sm text-primary underline">
          Abrir PDF
        </a>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img src={url} alt={label} className="w-full aspect-[4/3] object-cover hover:opacity-90 transition" />
        </a>
      )}
    </div>
  );
}

