import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Recycle, Users, BarChart3, ShieldCheck, ArrowRight, LeafyGreen } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecicladoresBR — Plataforma de Cadastro de Catadores" },
      {
        name: "description",
        content:
          "Plataforma intuitiva para cadastrar catadores de materiais recicláveis e conectá-los a organizações e empresas comprometidas com a sustentabilidade.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="grid place-items-center size-9 rounded-lg bg-primary text-primary-foreground">
              <Recycle className="size-5" />
            </span>
            <span>RecicladoresBR</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button>Acessar painel</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 35%)' }} />
        <div className="container relative mx-auto px-4 py-24 md:py-32 text-primary-foreground">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur-sm">
              <LeafyGreen className="size-3.5" />
              Sustentabilidade & inclusão social
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Dignidade e dados para quem move a reciclagem.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl">
              Cadastre, organize e dê visibilidade aos catadores de materiais recicláveis.
              Uma base confiável para cooperativas, organizações e empresas.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-base shadow-soft">
                  Acessar painel <ArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
              <a href="#sobre">
                <Button size="lg" variant="outline" className="text-base bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white">
                  Saiba mais
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="sobre" className="container mx-auto px-4 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold">Uma plataforma feita para gestores</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Ferramenta admin-first para registrar, filtrar e exportar dados de catadores
            com segurança e respeito à privacidade.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Cadastro assistido",
              desc: "Formulário em etapas para registrar catadores em nome deles, mesmo sem acesso à internet ou e-mail.",
            },
            {
              icon: BarChart3,
              title: "Filtros & exportação",
              desc: "Encontre catadores por material, escolaridade, programas sociais e exporte para CSV em um clique.",
            },
            {
              icon: ShieldCheck,
              title: "Dados protegidos",
              desc: "Acesso restrito por autenticação. Documentos armazenados em ambiente privado e criptografado.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-card p-6 shadow-card border border-border">
              <div className="grid place-items-center size-11 rounded-xl bg-primary-soft text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="rounded-3xl bg-gradient-warm p-10 md:p-14 text-secondary-foreground shadow-soft">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold">Pronto para começar?</h2>
            <p className="mt-3 text-white/90 text-lg">
              Crie sua conta de administrador em segundos e comece a cadastrar catadores agora mesmo.
            </p>
            <Link to="/auth" className="inline-block mt-8">
              <Button size="lg" variant="outline" className="bg-white text-secondary border-white hover:bg-white/90 hover:text-secondary">
                Acessar painel <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RecicladoresBR — Construído com propósito.
        </div>
      </footer>
    </div>
  );
}
