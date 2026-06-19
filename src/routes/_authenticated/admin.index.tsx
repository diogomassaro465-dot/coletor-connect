import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserCheck,
  UserCog,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  MATERIAIS_OPTIONS,
  STATUS_OPTIONS,
  STATUS_LABEL,
  GENERO_LABEL,
} from "@/lib/catador-constants";

export const Route = createFileRoute("/_authenticated/admin/")({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin && !context.isRecenseador)
      throw redirect({ to: "/admin/associacoes" });
  },
  head: () => ({ meta: [{ title: "Painel — RecicladoresBR" }] }),
  component: AdminDashboard,
});

type Catador = {
  id: string;
  nome_completo: string;
  cpf: string;
  genero: string;
  escolaridade: string;
  renda_media_mensal: number;
  materiais_coletados: string[];
  status: string;
  data_cadastro: string;
  nome_cooperativa: string | null;
  contribui_inss: boolean;
  inscrito_cadunico: boolean;
  possui_bolsa_familia: boolean;
};

function AdminDashboard() {
  const qc = useQueryClient();
  const { isAdmin, isRecenseador } = Route.useRouteContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [materialFilter, setMaterialFilter] = useState<string>("todos");
  const [rendaFilter, setRendaFilter] = useState<string>("todos");

  const { data: catadores, isLoading } = useQuery({
    queryKey: ["catadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catadores")
        .select(
          "id,nome_completo,cpf,genero,escolaridade,renda_media_mensal,materiais_coletados,status,data_cadastro,nome_cooperativa,contribui_inss,inscrito_cadunico,possui_bolsa_familia",
        )
        .order("data_cadastro", { ascending: false });
      if (error) throw error;
      return data as Catador[];
    },
  });

  const RENDA_THRESHOLD = 1412; // salário mínimo de referência

  const filtered = useMemo(() => {
    if (!catadores) return [];
    return catadores.filter((c) => {
      if (statusFilter !== "todos" && c.status !== statusFilter) return false;
      if (materialFilter !== "todos" && !c.materiais_coletados.includes(materialFilter))
        return false;
      if (rendaFilter === "menor" && !(c.renda_media_mensal < RENDA_THRESHOLD)) return false;
      if (rendaFilter === "maior" && !(c.renda_media_mensal >= RENDA_THRESHOLD)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const blob = `${c.nome_completo} ${c.cpf} ${c.nome_cooperativa ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [catadores, statusFilter, materialFilter, rendaFilter, search]);

  const stats = useMemo(() => {
    const total = catadores?.length ?? 0;
    const ativos = catadores?.filter((c) => c.status === "ativo").length ?? 0;
    const pendentes = catadores?.filter((c) => c.status === "pendente").length ?? 0;
    return { total, ativos, pendentes };
  }, [catadores]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catadores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Catador excluído.");
      qc.invalidateQueries({ queryKey: ["catadores"] });
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("catadores")
        .update({ status: status as "ativo" | "inativo" | "pendente" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["catadores"] });
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });

  async function exportXLSX() {
    if (!filtered.length) return toast.info("Nada para exportar.");
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "RecicladoresBR";
    wb.created = new Date();
    const ws = wb.addWorksheet("Catadores", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const columns: Array<{ header: string; key: string; numFmt?: string }> = [
      { header: "Nome", key: "nome" },
      { header: "CPF", key: "cpf" },
      { header: "Gênero", key: "genero" },
      { header: "Escolaridade", key: "escolaridade" },
      { header: "Cooperativa", key: "cooperativa" },
      { header: "Renda (R$)", key: "renda", numFmt: '"R$" #,##0.00' },
      { header: "Materiais", key: "materiais" },
      { header: "Contribui INSS", key: "inss" },
      { header: "CadÚnico", key: "cadunico" },
      { header: "Bolsa Família", key: "bolsa" },
      { header: "Status", key: "status" },
      { header: "Data Cadastro", key: "data", numFmt: "dd/mm/yyyy hh:mm" },
    ];
    ws.columns = columns.map((c) => ({
      header: c.header,
      key: c.key,
      style: c.numFmt ? { numFmt: c.numFmt } : undefined,
    }));

    filtered.forEach((c) => {
      ws.addRow({
        nome: c.nome_completo,
        cpf: c.cpf,
        genero: GENERO_LABEL[c.genero] ?? c.genero,
        escolaridade: c.escolaridade,
        cooperativa: c.nome_cooperativa ?? "",
        renda: Number(c.renda_media_mensal) || 0,
        materiais: c.materiais_coletados.join(", "),
        inss: c.contribui_inss ? "Sim" : "Não",
        cadunico: c.inscrito_cadunico ? "Sim" : "Não",
        bolsa: c.possui_bolsa_familia ? "Sim" : "Não",
        status: STATUS_LABEL[c.status] ?? c.status,
        data: new Date(c.data_cadastro),
      });
    });

    // Header styling
    const headerRow = ws.getRow(1);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FF15803D" } },
        bottom: { style: "thin", color: { argb: "FF15803D" } },
        left: { style: "thin", color: { argb: "FF15803D" } },
        right: { style: "thin", color: { argb: "FF15803D" } },
      };
    });

    // Body styling: zebra + borders
    const thin = { style: "thin" as const, color: { argb: "FFE5E7EB" } };
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const isEven = r % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { top: thin, bottom: thin, left: thin, right: thin };
        cell.alignment = { vertical: "middle", wrapText: true };
        if (isEven) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
        }
      });
    }

    // Auto-fit column widths
    ws.columns.forEach((col) => {
      let max = col.header ? String(col.header).length : 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const v = cell.value;
        let len = 0;
        if (v instanceof Date) len = 16;
        else if (v != null) len = String(v).length;
        if (len > max) max = len;
      });
      col.width = Math.min(Math.max(max + 2, 12), 60);
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catadores-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} registros exportados.`);
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catadores</h1>
          <p className="text-muted-foreground">Gerencie cadastros, filtre e exporte dados.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={exportXLSX}>
              <Download className="size-4" /> Exportar Excel
            </Button>
          )}
          {isRecenseador && (
            <Link to="/admin/novo">
              <Button>
                <Plus className="size-4" /> Novo catador
              </Button>
            </Link>
          )}
          <Link to="/admin/associacoes">
            <Button variant={isRecenseador ? "outline" : "default"}>Escolher entidade</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard icon={Users} label="Total" value={stats.total} tone="primary" />
        <StatCard icon={UserCheck} label="Ativos" value={stats.ativos} tone="success" />
        <StatCard icon={UserCog} label="Pendentes" value={stats.pendentes} tone="warning" />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4 flex flex-wrap items-center gap-3 shadow-card">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou cooperativa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={materialFilter} onValueChange={setMaterialFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos materiais</SelectItem>
              {MATERIAIS_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rendaFilter} onValueChange={setRendaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Renda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as rendas</SelectItem>
              <SelectItem value="menor">Menor que R$ 1.412</SelectItem>
              <SelectItem value="maior">Maior ou igual a R$ 1.412</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">CPF</TableHead>
              <TableHead className="hidden lg:table-cell">Cooperativa</TableHead>
              <TableHead className="hidden md:table-cell">Materiais</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <p className="text-muted-foreground">Nenhum catador encontrado.</p>
                  <Link to="/admin/associacoes" className="inline-block mt-4">
                    <Button size="sm">Escolher entidade</Button>
                  </Link>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/40">
                <TableCell>
                  <Link
                    to="/admin/$id"
                    params={{ id: c.id }}
                    className="font-medium hover:underline"
                  >
                    {c.nome_completo}
                  </Link>
                  <div className="md:hidden text-xs text-muted-foreground mt-0.5">{c.cpf}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm tabular-nums">{c.cpf}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {c.nome_cooperativa ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[280px]">
                    {c.materiais_coletados.slice(0, 3).map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs">
                        {m}
                      </Badge>
                    ))}
                    {c.materiais_coletados.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{c.materiais_coletados.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <Link to="/admin/$id" params={{ id: c.id }}>
                        <DropdownMenuItem>
                          <Eye className="size-4" /> Ver detalhes
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/admin/$id/editar" params={{ id: c.id }}>
                        <DropdownMenuItem>
                          <Pencil className="size-4" /> Editar
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Status
                      </DropdownMenuLabel>
                      {STATUS_OPTIONS.map((s) => (
                        <DropdownMenuItem
                          key={s.value}
                          disabled={c.status === s.value}
                          onClick={() => statusMutation.mutate({ id: c.id, status: s.value })}
                        >
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" /> Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir cadastro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é irreversível. O cadastro de{" "}
                              <strong>{c.nome_completo}</strong> será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(c.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "primary" | "success" | "warning";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card flex items-center gap-4">
      <div className={`grid place-items-center size-12 rounded-xl ${tones[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ativo: "bg-success/15 text-success border-success/30",
    pendente: "bg-warning/20 text-warning-foreground border-warning/40",
    inativo: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={map[status] ?? ""}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
