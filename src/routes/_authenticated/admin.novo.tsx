import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { CatadorForm } from "@/components/admin/CatadorForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/novo")({
  head: () => ({ meta: [{ title: "Novo cadastro — RecicladoresBR" }] }),
  component: NovoCatador,
});

function NovoCatador() {
  return (
    <AdminShell>
      <Link to="/admin">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="size-4" /> Voltar ao painel
        </Button>
      </Link>
      <div className="mb-8 max-w-6xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Cadastro individual</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Novo cadastro</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Preencha os blocos abaixo para cadastrar um(a) catador(a). Seu progresso é salvo automaticamente neste aparelho.</p>
      </div>
      <CatadorForm mode="create" />
    </AdminShell>
  );
}
