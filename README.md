# Gestor de Gastos

Aplicativo financeiro em React para organizar gastos, contas, cartões, metas e
planejamento pessoal.

O projeto está na Sprint 3: Supabase e autenticação. A aplicação já possui
cliente Supabase, sessão persistente, contexto de autenticação, rotas protegidas
e telas públicas para login, cadastro e recuperação de senha.

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

A migration inicial está em:

```txt
supabase/migrations/001_create_profiles.sql
```

Ela cria:

- tabela `profiles`
- campos `id`, `email`, `created_at`, `updated_at`
- trigger para atualizar `updated_at`
- trigger para criar perfil ao cadastrar usuário em `auth.users`
- RLS em `profiles`
- policy para cada usuário ler apenas o próprio perfil
- policy para cada usuário atualizar apenas o próprio perfil

## Estrutura atual

```txt
src/
  app/
    navigation.ts
    routes.tsx
  components/
    auth/
    layout/
    ui/
  context/
    auth/
  lib/
    supabase/
  pages/
    auth/
  styles/
  types/
supabase/
  migrations/
```

## Rotas de autenticação

- `/login`
- `/cadastro`
- `/recuperar-senha`

## Rotas protegidas

Todas as rotas principais do app exigem sessão ativa:

- `/`
- `/transacoes`
- `/contas`
- `/cartoes`
- `/metas`
- `/dividas`
- `/calendario`
- `/assinaturas`
- `/orcamentos`
- `/configuracoes`

## Design System

Componentes disponíveis:

- Button
- Input
- Card
- Modal
- Dialog
- Select
- Badge
- EmptyState
- LoadingState

## Escopo atual

Implementado:

- Cliente Supabase
- `.env.example`
- Login
- Cadastro
- Logout
- Recuperação de senha
- Sessão persistente
- Contexto de autenticação
- Rotas protegidas
- Redirecionamento automático
- Tabela `profiles` via SQL
- RLS para isolamento por usuário

Ainda não implementado:

- Contas
- Transações
- Cartões
- Metas
- Calendário financeiro
- PWA
