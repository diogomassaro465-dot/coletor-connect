## Já implementado (referência rápida)

- Papéis estritos (Admin / Recenseador / Consultor) com guards de rota
- Cadastro de usuários operacionais pelo Admin (nome, CPF, nascimento, e-mail, senha, perfil)
- created_by / updated_by + tabela `audit_logs` com triggers em catadores, associações e diagnósticos
- Bug CTPS / cooperativa / novo catador corrigidos
- Edição de associação funcionando
- Exportação Excel de catadores (12 colunas)

## Pendente — agrupado por bloco

### Bloco 1 — Cadastro de usuários (complementos rápidos)
- Adicionar campos **Município de Referência** e **Identificação Profissional** no formulário de novo usuário.
- Validador de força de senha + flag `must_reset_password` (forçar redefinição no 1º acesso).

### Bloco 2 — Perfil self-service
- Rota `/admin/perfil` para Recenseador/Consultor editar nome, e-mail, município, identificação, foto (bucket novo `avatars`) e trocar senha. CPF somente leitura.

### Bloco 3 — Catadores: ajustes de dados e UX
- Atualizar `RENDA_THRESHOLD` para **R$ 1.621,00** (lista e exportação).
- Expandir `MATERIAIS_OPTIONS` com regionalismos (PET, garrafa, sucata branca/preta, papelão misto, tetrapak, EPS, etc.).
- Inverter lógica do dropdown de Status: status atual marcado/destacado, demais como opções selecionáveis (já está disabled-no-atual; trocar para checkmark + ordem fixa).
- Tooltip explicando o status **Inativo** ("catador sem coleta nos últimos 90 dias").
- Exportação Excel **completa**: incluir todos os ~37 campos do catador (endereço, dependentes, programas sociais, CTPS, etc.).
- Aba **Histórico** no detalhe do catador lendo `audit_logs` filtrado por `record_id`.

### Bloco 4 — Catadores: importação em massa
- Upload CSV/XLSX com pré-visualização, validação por linha (CPF, materiais, renda), detecção de duplicidade por CPF e relatório final de sucesso/erro.

### Bloco 5 — Associações: relatórios e documentos
- Tab "Documentos" na associação: bucket `associacoes-docs`, upload com versionamento (`document_versions`).
- Relatório PDF/Excel por associação: dados cadastrais + histórico de diagnósticos + evolução do índice + lista de catadores vinculados.

### Bloco 6 — Regularidade institucional (dashboards)
- Reformular `/admin/diagnosticos`: cards (índice médio, total, evidências pendentes), gráfico de distribuição de status, gráfico de evolução temporal.
- Categorias **Regulares / Atenção parcial / Ação prioritária** derivadas do `regularity_index` (≥80 / 50–79 / <50).
- Filtros por município e período.

### Bloco 7 — Identidade visual e UX
- Hero image gerada por IA na landing `/` (reciclagem positiva, sem rostos).
- Ajuste do dropdown de status (item do Bloco 3, separado para tocar no índice landing).

### Bloco 8 — Notificações
- Sino no header listando: diagnósticos pendentes (>30d sem visita), evidências não validadas, novos cadastros aguardando ativação. Tabela `notifications` + RLS por papel.

## Detalhes técnicos

- Migrations novas: `profiles` ganha `municipio_referencia`, `identificacao_profissional`, `avatar_url`, `must_reset_password`; nova tabela `notifications`; novo bucket `avatars` (público) e `associacoes-docs` (privado) + policies por papel.
- Frontend: novas rotas `/admin/perfil`, `/admin/catadores/importar`, `/admin/associacoes/$id/documentos`, `/admin/associacoes/$id/relatorio`. Recharts já é candidato para os gráficos do Bloco 6.
- Hero image: `imagegen--generate_image` (standard) em `src/assets/hero-reciclagem.jpg`.

## Sugestão de execução

Posso atacar **Blocos 1 + 3 + 7 (hero) em uma rodada** (mudanças pequenas e visíveis), depois **Bloco 2 (perfil self-service)**, depois **Bloco 6 (dashboards)**, e por fim os blocos pesados (4 importação, 5 documentos/relatórios, 8 notificações).

Me confirma se sigo nessa ordem ou se quer outra priorização.