# Gestor de Gastos

Aplicativo financeiro em React para organizar gastos, contas, cartões,
transações, metas, dívidas e reserva de emergência.

O projeto está na Sprint 7: Metas, Dívidas e Reserva de Emergência.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase
- Recharts
- Lucide React

## Como Rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Configure no `.env`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

Validação:

```bash
npm run lint
npm run build
```

## Migrations Supabase

Execute nesta ordem:

```txt
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_financial_core.sql
supabase/migrations/003_create_credit_cards.sql
supabase/migrations/004_create_planning_core.sql
```

Pelo painel:

1. Abra o projeto no Supabase.
2. Vá em SQL Editor.
3. Execute os arquivos acima em ordem.

Com Supabase CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

## Sprint 7

Tabelas criadas:

- `goals`
- `goal_movements`
- `debts`
- `debt_payments`
- `emergency_reserve_settings`

Funcionalidades:

- Criar, editar e excluir metas.
- Aportar em metas.
- Retirar de metas.
- Histórico de aportes e retiradas.
- Aporte gera transação de despesa quando uma conta é escolhida.
- Retirada gera transação de receita quando uma conta é escolhida.
- Criar, editar e excluir dívidas.
- Registrar pagamento parcial de dívida.
- Pagamento de dívida gera transação de despesa.
- Progresso de quitação.
- Próxima parcela.
- Alerta para dívidas com juros altos.
- Reserva de emergência com meta de 3, 6, 9 ou 12 meses.
- Reserva vinculada a uma meta existente.
- Dashboard com principais metas, total em dívidas, reserva e alertas de dívida.

## Como Testar

Metas:

1. Vá para `Metas`.
2. Crie uma meta com valor alvo e valor atual.
3. Clique em `Aportar`.
4. Escolha uma conta para gerar uma transação de despesa.
5. Clique em `Retirar`.
6. Escolha uma conta para gerar uma transação de receita.
7. Confira o histórico dentro do card da meta.

Dívidas:

1. Vá para `Dívidas`.
2. Crie uma dívida com valor original, saldo restante, juros e parcela.
3. Clique em `Pagar parcela`.
4. Escolha a conta de pagamento.
5. Confira o progresso de quitação e a transação criada.

Reserva:

1. Vá para `Metas`.
2. Crie uma meta para reserva.
3. No bloco `Reserva de emergência`, selecione 3, 6, 9 ou 12 meses.
4. Vincule a meta criada.
5. O sistema calcula valor recomendado, valor atual, meses cobertos e progresso.

## Ainda Não Implementado

- Calendário financeiro
- Assinaturas
- Orçamentos
- Notificações
- OCR
- IA
- PWA
