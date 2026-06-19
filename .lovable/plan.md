## Onde paramos

Blocos já entregues: **1 (cadastro complementos)**, **2 (perfil self-service)**, **3 (catadores UX/dados)** e **7 (identidade visual / hero)**.

Próximo da fila: **Bloco 6 — Regularidade institucional (dashboards)**. Depois seguem 4 (importação em massa), 5 (documentos/relatórios de associação) e 8 (notificações).

## O que vou fazer agora (Bloco 6)

Reformular a tela `/admin/diagnosticos` para virar um painel real de acompanhamento da regularidade das associações, usando os diagnósticos já cadastrados (`association_assessments`).

### Cards de resumo no topo
- **Índice médio de regularidade** (média de `regularity_index` dos diagnósticos validados).
- **Total de diagnósticos** no período filtrado.
- **Evidências pendentes** (`evidence_validated = false`).
- **Associações sem diagnóstico nos últimos 90 dias**.

### Categorias de regularidade
Derivadas do `regularity_index` do diagnóstico mais recente de cada associação:
- **Regulares** — índice ≥ 80
- **Atenção parcial** — índice 50–79
- **Ação prioritária** — índice < 50
- **Sem diagnóstico** — associação sem registro

Cada categoria vira um card clicável que filtra a lista abaixo.

### Gráficos (Recharts)
- **Distribuição por categoria** (donut/pizza): Regulares / Atenção / Prioritária / Sem diagnóstico.
- **Evolução do índice médio** (linha) por mês nos últimos 12 meses.
- **Top municípios** (barras horizontais) com pior índice médio — para orientar visita técnica.

### Filtros
- **Município** (select com municípios distintos das associações).
- **Período** (últimos 30 / 90 / 180 / 365 dias / tudo).
- **Status do diagnóstico** (regular / parcialmente_regular / irregular).

### Lista detalhada
Tabela com: associação, município, índice mais recente, categoria (badge colorido), data do último diagnóstico, evidências validadas (sim/não), ação (abrir diagnóstico). Mantém a busca por nome.

### Acesso por papel
- **Admin** e **Consultor**: veem tudo.
- **Recenseador**: não tem acesso à tela (já bloqueado pelo guard atual, mantemos).

## Detalhes técnicos

- Tudo client-side com queries Supabase já existentes; nada de schema novo.
- Cálculo da categoria por associação usa a linha mais recente de `association_assessments` (por `association_id`, `created_at desc`).
- Recharts já está no projeto (`src/components/ui/chart.tsx`); reusar `ChartContainer` para manter tema.
- Cores das categorias via tokens semânticos já definidos em `src/styles.css` (success / warning / destructive / muted) — nada hard-coded.
- Arquivo principal: `src/routes/_authenticated/admin.diagnosticos.tsx` (refatoração completa).
- Sem mudanças de banco; sem novas migrations; sem novos buckets.

## Fora do escopo deste bloco
Importação em massa (Bloco 4), documentos/relatório PDF da associação (Bloco 5) e notificações (Bloco 8) — entrego em rodadas seguintes.

Sigo por aqui?