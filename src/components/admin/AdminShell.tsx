import { Link, useNavigate } from "@tanstack/react-router";
import { Recycle, LogOut, LayoutDashboard, UserPlus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

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
          <Link to="/admin" className="flex items-center gap-2 font-display font-bold">
            <span className="grid place-items-center size-9 rounded-lg bg-primary text-primary-foreground">
              <Recycle className="size-5" />
            </span>
            <span>RecicladoresBR</span>
            <span className="hidden sm:inline-block text-xs font-medium uppercase tracking-wider text-muted-foreground ml-2 px-2 py-0.5 rounded bg-muted">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="size-4" /> <span className="hidden sm:inline">Catadores</span>
              </Button>
            </Link>
             <Link to="/admin/associacoes">
               <Button variant="ghost" size="sm">
                 <Building2 className="size-4" /> <span className="hidden md:inline">Associações e diagnósticos</span>
               </Button>
             </Link>
            <Link to="/admin/novo">
              <Button variant="default" size="sm">
                 <UserPlus className="size-4" /> <span className="hidden sm:inline">Cadastrar catador</span>
              </Button>
            </Link>
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
