import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import {
  LogOut,
  LayoutDashboard,
  Building2,
  BarChart3,
  ClipboardPenLine,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import procateLogo from "@/assets/procate-logo.png";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin, isConsultant, isRecenseador } = useRouteContext({
    from: "/_authenticated",
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/95 backdrop-blur border-b border-border sticky top-0 z-30">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            to={isAdmin ? "/admin" : "/admin/associacoes"}
            className="flex items-center gap-2"
            aria-label="PROCATE — Painel administrativo"
          >
            <img
              src={procateLogo}
              alt="PROCATE — Projeto Catador Empreendedor"
              className="h-10 w-auto sm:h-11"
            />
            <span className="hidden sm:inline-block text-xs font-medium uppercase tracking-wider text-muted-foreground ml-2 px-2 py-0.5 rounded bg-muted">
              {isAdmin ? "Administrador UCIP" : "Consultor"}
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="size-4" />{" "}
                  <span className="hidden sm:inline">Catadores</span>
                </Button>
              </Link>
            )}
            <Link to="/admin/associacoes">
              <Button variant="ghost" size="sm">
                {isAdmin ? (
                  <Building2 className="size-4" />
                ) : (
                  <ClipboardPenLine className="size-4" />
                )}{" "}
                <span className="hidden md:inline">
                  {isAdmin ? "Associações" : "Cadastros de campo"}
                </span>
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin/diagnosticos">
                <Button variant="ghost" size="sm">
                  <BarChart3 className="size-4" />{" "}
                  <span className="hidden lg:inline">Regularidade</span>
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} title="Sair">
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:py-10">{children}</main>
    </div>
  );
}
