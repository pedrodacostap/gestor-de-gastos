# Gestor de Gastos

Aplicativo financeiro em React para organizar gastos, contas, categorias,
transações, cartões de crédito, faturas e parcelamentos.

O projeto está na Sprint 6: Cartões, Faturas e Parcelamentos. A aplicação já
possui autenticação com Supabase, CRUD financeiro core, dashboard com dados
reais e sistema funcional de cartão de crédito.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase
- Recharts
- Lucide React

## Como Rodar Localmente

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Preencha as variáveis:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Valide o build:

```bash
npm run build
```

## Supabase

Migrations disponíveis:

```txt
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_financial_core.sql
supabase/migrations/003_create_credit_cards.sql
```

Para aplicar pelo painel do Supabase:

1. Abra o projeto no Supabase.
2. Acesse SQL Editor.
3. Execute `001_create_profiles.sql`.
4. Execute `002_create_financial_core.sql`.
5. Execute `003_create_credit_cards.sql`.

Para aplicar com Supabase CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

## Cartões e Faturas

Tabelas implementadas:

- `credit_cards`
- `credit_card_purchases`
- `credit_card_installments`
- `credit_card_invoice_payments`

Funcionalidades:

- Criar, editar e excluir cartão sem compras vinculadas.
- Criar compra à vista no crédito.
- Criar compra parcelada.
- Gerar parcelas mensais automaticamente.
- Exibir fatura atual, faturas futuras e histórico.
- Calcular total da fatura.
- Marcar fatura como paga.
- Escolher conta bancária para pagar fatura.
- Criar transação de despesa ao pagar fatura.
- Calcular limite disponível.
- Exibir barra de uso do limite.

Regras:

- Compra no crédito não reduz saldo da conta imediatamente.
- Apenas o pagamento da fatura gera despesa na conta bancária.
- Parcelas futuras aparecem no mês correto.
- Editar compra recria parcelas sem duplicar.
- Excluir compra remove as parcelas relacionadas.
- Compra com parcela paga não pode ser editada ou excluída sem remover o pagamento.

## Como Testar Cartão, Fatura e Parcelamento

1. Crie uma conta em `Contas`.
2. Crie categorias de despesa em `Transações`, se quiser categorizar compras.
3. Vá para `Cartões`.
4. Crie um cartão com limite, fechamento e vencimento.
5. Crie uma compra à vista com `1` parcela.
6. Crie uma compra parcelada, por exemplo:

```txt
Notebook
R$ 4.200
12 parcelas
```

O app gera 12 parcelas mensais de R$ 350, ajustando centavos na última parcela
se necessário.

7. Abra a fatura atual para ver as parcelas do mês.
8. Abra faturas futuras para ver os próximos meses.
9. Pague uma fatura escolhendo uma conta.
10. Confira em `Transações` que uma despesa foi criada na conta escolhida.

## Dashboard

O Dashboard inclui:

- Saldo total atual
- Receitas do mês
- Despesas do mês
- Resultado do mês
- Taxa de economia
- Evolução mensal
- Gastos por categoria
- Ranking de maiores despesas
- Total em faturas abertas
- Próximo vencimento de cartão
- Percentual de limite utilizado

## Ainda Não Implementado

- Metas
- Dívidas
- Calendário financeiro
- Assinaturas
- Notificações
- PWA
