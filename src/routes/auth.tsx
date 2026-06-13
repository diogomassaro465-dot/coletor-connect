import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Recycle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Entrar — RecicladoresBR" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
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

  async function handleSignUp() {
    if (!email || password.length < 8) {
      toast.error("Informe um e-mail válido e uma senha com pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    toast.success("Conta criada. Avise aqui para eu conceder o acesso administrativo e fechar o cadastro.");
    setCreatingAccount(false);
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left visual */}
      <div className="hidden md:flex relative bg-gradient-hero text-primary-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid place-items-center size-9 rounded-lg bg-white/15 backdrop-blur">
            <Recycle className="size-5" />
          </span>
          RecicladoresBR
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            "Reciclar é dignidade. Catalogar é poder."
          </h2>
          <p className="mt-4 text-white/85">
            Gerencie cadastros com segurança e dê visibilidade às pessoas que sustentam a reciclagem no Brasil.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden flex items-center gap-2 font-display font-bold text-lg mb-8">
            <span className="grid place-items-center size-9 rounded-lg bg-primary text-primary-foreground">
              <Recycle className="size-5" />
            </span>
            RecicladoresBR
          </Link>
          <h1 className="text-2xl font-bold">Acessar painel</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {creatingAccount ? "Crie sua conta temporária de acesso." : "Acesso restrito para administradores e atendentes."}
          </p>

              <form onSubmit={handleLogin} className="mt-8 space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />} {creatingAccount ? "Criar conta" : "Entrar"}
                </Button>
              </form>
          {creatingAccount ? (
            <Button type="button" variant="ghost" className="mt-3 w-full" disabled={loading} onClick={handleSignUp}>
              Confirmar criação da conta
            </Button>
          ) : null}
          <Button type="button" variant="link" className="mt-2 w-full" onClick={() => setCreatingAccount((value) => !value)}>
            {creatingAccount ? "Voltar para o login" : "Criar minha conta agora"}
          </Button>
        </div>
      </div>
    </div>
  );
}
