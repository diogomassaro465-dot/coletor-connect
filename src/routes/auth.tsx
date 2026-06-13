import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import procateLogo from "@/assets/procate-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Entrar — RecicladoresBR" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin/novo" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Falha no login", { description: error.message });
      return;
    }
    toast.success("Bem-vindo!");
    navigate({ to: "/admin/novo" });
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left visual */}
      <div className="hidden md:flex relative bg-gradient-hero text-primary-foreground p-12 flex-col justify-between">
        <Link
          to="/"
          className="w-fit rounded-2xl bg-card/95 px-5 py-3 shadow-soft"
          aria-label="PROCATE — Página inicial"
        >
          <img
            src={procateLogo}
            alt="PROCATE — Projeto Catador Empreendedor"
            className="h-14 w-auto"
          />
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            "Reciclar é dignidade. Catalogar é poder."
          </h2>
          <p className="mt-4 text-white/85">
            Gerencie cadastros com segurança e dê visibilidade às pessoas que sustentam a reciclagem
            no Brasil.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 block w-fit md:hidden" aria-label="PROCATE — Página inicial">
            <img
              src={procateLogo}
              alt="PROCATE — Projeto Catador Empreendedor"
              className="h-14 w-auto max-w-full"
            />
          </Link>
          <h1 className="text-2xl font-bold">Acessar painel</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acesso restrito para administradores e atendentes.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />} Entrar
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Contas são fornecidas exclusivamente pela administração do projeto.
          </p>
        </div>
      </div>
    </div>
  );
}
