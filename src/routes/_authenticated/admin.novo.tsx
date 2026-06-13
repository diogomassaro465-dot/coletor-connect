import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { CatadorForm } from "@/components/admin/CatadorForm";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Calculator, Scale, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/novo")({
  head: () => ({ meta: [{ title: "Novo cadastro — RecicladoresBR" }] }),
  component: NovoCatador,
});

function NovoCatador() {
  const [associationId, setAssociationId] = useState("");
  const { data: associations = [] } = useQuery({
    queryKey: ["associations-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("associations").select("id,nome").eq("ativa", true).order("nome");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell>
      <Link to="/admin">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="size-4" /> Voltar ao painel
        </Button>
      </Link>
      <div className="mb-8 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cadastro de catador</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Escolha o tipo de cadastro</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Acesse neste mesmo espaço os três formulários de campo: Social, Jurídico e Contábil.</p>
      </div>
      <Tabs defaultValue="social" className="mx-auto max-w-6xl">
        <TabsList className="mb-8 grid h-auto w-full grid-cols-3 rounded-2xl p-1.5">
          <TabsTrigger value="social" className="gap-2 py-3 data-[state=active]:text-destructive"><Users className="size-4" /><span className="hidden sm:inline">Cadastro </span>Social</TabsTrigger>
          <TabsTrigger value="juridico" className="gap-2 py-3 data-[state=active]:text-primary"><Scale className="size-4" /><span className="hidden sm:inline">Cadastro </span>Jurídico</TabsTrigger>
          <TabsTrigger value="contabil" className="gap-2 py-3 data-[state=active]:text-warning-foreground"><Calculator className="size-4" /><span className="hidden sm:inline">Cadastro </span>Contábil</TabsTrigger>
        </TabsList>

        <TabsContent value="social">
          <CatadorForm mode="create" />
        </TabsContent>
        <TabsContent value="juridico">
          <AssociationModuleSelector associationId={associationId} setAssociationId={setAssociationId} associations={associations} module="juridico" icon={<Scale className="size-6" />} title="Cadastro Jurídico" description="Diretoria, atas, contratos, processos, regras internas e regularização da entidade do catador." />
        </TabsContent>
        <TabsContent value="contabil">
          <AssociationModuleSelector associationId={associationId} setAssociationId={setAssociationId} associations={associations} module="contabil" icon={<Calculator className="size-6" />} title="Cadastro Contábil" description="Livros, contador, controles financeiros, balanços e pendências contábeis da entidade do catador." />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function AssociationModuleSelector({ associationId, setAssociationId, associations, module, icon, title, description }: { associationId: string; setAssociationId: (value: string) => void; associations: Array<{ id: string; nome: string }>; module: "juridico" | "contabil"; icon: React.ReactNode; title: string; description: string }) {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-card md:p-9">
      <div className="mb-7 flex items-start gap-4 border-b border-border pb-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">{icon}</span>
        <div><h2 className="text-2xl font-bold">{title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
      </div>
      <label className="mb-2 block text-sm font-semibold">Associação ou cooperativa vinculada</label>
      <Select value={associationId} onValueChange={setAssociationId}>
        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione a entidade para continuar" /></SelectTrigger>
        <SelectContent>{associations.map((association) => <SelectItem key={association.id} value={association.id}>{association.nome}</SelectItem>)}</SelectContent>
      </Select>
      <div className="mt-6 flex justify-end">
        {associationId ? <Link to="/admin/associacoes/$id/diagnostico/novo" params={{ id: associationId }} search={{ modulo: module }}><Button size="lg">Abrir {title.toLowerCase()} <ArrowRight className="size-4" /></Button></Link> : <Button size="lg" disabled>Selecione uma entidade <ArrowRight className="size-4" /></Button>}
      </div>
    </section>
  );
}
