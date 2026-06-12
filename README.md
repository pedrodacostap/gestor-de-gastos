# Gestor de Gastos

Aplicativo financeiro em React para organizar gastos, contas, categorias,
transações e visão financeira mensal.

O projeto está na Sprint 5: Dashboard Financeiro. A aplicação já possui
autenticação com Supabase, CRUD funcional para contas/categorias/transações e
um dashboard com dados reais, gráficos e alertas simples.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase
- Recharts
- Lucide React

## Requisitos

- Node.js 20 ou superior
- npm
- Projeto Supabase
- Supabase CLI opcional para aplicar migrations localmente

## Como rodar localmente

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

Valide o build de produção:

```bash
npm run build
```

Execute o lint:

```bash
npm run lint
```

## Supabase

Migrations disponíveis:

```txt
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_financial_core.sql
```

Para aplicar pelo painel do Supabase:

1. Abra o projeto no Supabase.
2. Acesse SQL Editor.
3. Execute primeiro `001_create_profiles.sql`.
4. Execute depois `002_create_financial_core.sql`.

Para aplicar com Supabase CLI:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

## Dashboard Financeiro

Indicadores implementados:

- Saldo total atual
- Receitas do mês
- Despesas do mês
- Resultado do mês
- Taxa de economia
- Últimas transações
- Gastos por categoria
- Evolução mensal de receitas x despesas
- Ranking de maiores despesas
- Alertas simples

Alertas implementados:

- Mês negativo
- Nenhuma conta cadastrada
- Nenhuma transação no mês
- Categoria com gasto muito alto
- Saldo total negativo

Filtros implementados:

- Mês atual
- Mês anterior
- Seletor de mês/ano

## Como os Cálculos Funcionam

- Saldo total: soma do saldo inicial de cada conta mais receitas e menos despesas de todas as transações da conta.
- Receitas do mês: soma das transações `income` dentro do mês selecionado.
- Despesas do mês: soma das transações `expense` dentro do mês selecionado.
- Resultado do mês: receitas do mês menos despesas do mês.
- Taxa de economia: resultado do mês dividido pelas receitas do mês, multiplicado por 100.
- Gastos por categoria: soma das despesas do mês agrupadas por categoria.
- Evolução mensal: soma receitas e despesas de cada um dos últimos seis meses até o mês selecionado.
- Ranking de maiores despesas: lista as cinco maiores despesas do mês selecionado.

## Banco de Dados

Tabelas implementadas:

- `profiles`
- `accounts`
- `categories`
- `transactions`

Regras implementadas:

- RLS habilitado em todas as tabelas do core financeiro.
- Cada usuário só pode ler, criar, editar e excluir seus próprios dados.
- Categorias padrão são criadas automaticamente para novos usuários.
- Contas não podem ser excluídas pelo app se tiverem transações vinculadas.

## Ainda Não Implementado

- Cartões
- Faturas
- Metas
- Dívidas
- Calendário financeiro
- Assinaturas
- PWA
