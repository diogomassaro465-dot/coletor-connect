import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Download, MapPin, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/associacoes/")({
  head: () => ({ meta: [{ title: "Associações — PROCATE" }] }),
  component: AssociationsPage,
});

function AssociationsPage() {
  const { role } = Route.useRouteContext();
  const isAdmin = role === "admin";
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["associations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("associations").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return data;
    return data.filter((item) =>
      `${item.nome} ${item.municipio} ${item.cnpj ?? ""}`.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [data, search]);

  async function exportAssociations() {
    if (!filtered.length) return toast.info("Nenhuma entidade para exportar.");
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Entidades", { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = [
      { header: "Nome", key: "nome" }, { header: "Tipo", key: "tipo" }, { header: "CNPJ", key: "cnpj" },
      { header: "Município", key: "municipio" }, { header: "Endereço", key: "endereco" }, { header: "Telefone", key: "telefone" },
      { header: "E-mail", key: "email" }, { header: "Associados iniciais", key: "iniciais" }, { header: "Associados atuais", key: "atuais" },
    ];
    filtered.forEach((item) => sheet.addRow({ nome: item.nome, tipo: item.tipo, cnpj: item.cnpj ?? "", municipio: item.municipio, endereco: item.endereco_sede, telefone: item.telefone ?? "", email: item.email ?? "", iniciais: item.numero_associados_inicial, atuais: item.numero_associados_atual }));
    sheet.getRow(1).eachCell((cell) => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } }; cell.alignment = { horizontal: "center", vertical: "middle" }; });
    sheet.columns.forEach((column) => { let width = 12; column.eachCell?.({ includeEmpty: false }, (cell) => { width = Math.max(width, String(cell.value ?? "").length + 2); }); column.width = Math.min(width, 60); });
    sheet.eachRow((row, index) => row.eachCell((cell) => { cell.alignment = { vertical: "top", wrapText: true }; const edge = { style: "thin" as const, color: { argb: "FFE5E7EB" } }; cell.border = { top: edge, bottom: edge, left: edge, right: edge }; if (index > 1 && index % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; }));
    const buffer = await workbook.xlsx.writeBuffer(); const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })); const link = document.createElement("a"); link.href = url; link.download = `entidades-procate-${new Date().toISOString().slice(0,10)}.xlsx`; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Associações e cooperativas</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? "Base oficial de entidades vinculadas ao PROCATE." : "Selecione uma entidade para iniciar o cadastro assistido em campo."}
          </p>
        </div>
        {isAdmin && <div className="flex gap-2"><Button variant="outline" size="lg" onClick={exportAssociations}><Download className="size-4" /> Exportar Excel</Button><Link to="/admin/associacoes/nova"><Button size="lg"><Plus className="size-4" /> Nova entidade</Button></Link></div>}
      </div>

      <div className="mb-6 flex items-center gap-3 border-b border-border pb-6">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, município ou CNPJ" className="pl-9" />
        </div>
        <Badge variant="secondary">{filtered.length} entidades</Badge>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Carregando entidades...</p>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Nenhuma entidade encontrada</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre a primeira entidade ou carregue a relação oficial das 116 associações.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <Link key={item.id} to="/admin/associacoes/$id" params={{ id: item.id }} className="block">
            <article className="rounded-xl border border-border bg-card p-5 shadow-card transition hover:border-primary/40 hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Building2 className="size-5" /></div>
                <Badge variant={item.ativa ? "secondary" : "outline"}>{item.ativa ? "Ativa" : "Inativa"}</Badge>
              </div>
              <h2 className="mt-4 font-semibold leading-snug">{item.nome}</h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" /> {item.municipio}</p>
              <div className="mt-4 border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">Associados atuais</span>
                <strong className="float-right tabular-nums">{item.numero_associados_atual}</strong>
              </div>
            </article>
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}