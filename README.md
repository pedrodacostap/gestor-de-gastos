# Gestor de Gastos

Aplicativo financeiro em React para organizar gastos, contas, categorias e
transações.

O projeto está na Sprint 4: Modelagem Financeira Core. A aplicação já possui
autenticação com Supabase, rotas protegidas e CRUD funcional para contas,
categorias e transações.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase
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

## Funcionalidades Atuais

Contas:

- Criar conta
- Editar conta
- Excluir conta sem transações
- Listar contas
- Calcular saldo atual com saldo inicial + transações

Categorias:

- Categorias padrão automáticas
- Categoria personalizada
- Separação entre receita e despesa

Transações:

- Criar receita
- Criar despesa
- Editar
- Excluir
- Duplicar
- Filtrar por mês
- Filtrar por tipo
- Filtrar por conta
- Filtrar por categoria
- Buscar por texto

Dashboard:

- Saldo total
- Receitas do mês
- Despesas do mês
- Resultado do mês
- Últimas transações
- Gastos por categoria

## Estrutura Atual

```txt
src/
  app/
  components/
    auth/
    layout/
    ui/
  context/
    auth/
  lib/
  pages/
    auth/
  services/
  styles/
  types/
supabase/
  migrations/
```

## Ainda Não Implementado

- Cartões
- Faturas
- Metas
- Dívidas
- Calendário financeiro
- Assinaturas
- PWA
