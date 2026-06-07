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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Novo cadastro</h1>
        <p className="text-muted-foreground mt-1">Preencha as etapas a seguir para cadastrar um(a) catador(a).</p>
      </div>
      <CatadorForm mode="create" />
    </AdminShell>
  );
}
