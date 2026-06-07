import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setLoading(false);
    if (error) {
      toast.error("Falha no cadastro", { description: error.message });
      return;
    }
    toast.success("Conta criada!", { description: "Você já pode entrar." });
    // Auto sign in (email confirm is auto)
    const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
    if (!e2) navigate({ to: "/admin" });
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
            Acesso restrito para administradores e atendentes.
          </p>

          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />} Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="emailS">E-mail</Label>
                  <Input id="emailS" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="passwordS">Senha</Label>
                  <Input id="passwordS" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres.</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />} Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
