# Gestor de Gastos

Aplicativo financeiro em React para organizar gastos, contas, cartões,
transações, metas, dívidas, assinaturas, orçamentos e planejamento pessoal.

O projeto está na Sprint 9: PWA, Offline e Instalação.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase
- Recharts
- Lucide React
- vite-plugin-pwa

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

Teste do PWA em produção local:

```bash
npm run build
npm run preview
```

## Migrations Supabase

Execute nesta ordem:

```txt
supabase/migrations/001_create_profiles.sql
supabase/migrations/002_create_financial_core.sql
supabase/migrations/003_create_credit_cards.sql
supabase/migrations/004_create_planning_core.sql
supabase/migrations/005_create_calendar_subscriptions_budgets.sql
supabase/migrations/006_repair_financial_core_rls.sql
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

## PWA

O app possui manifest, ícones, Apple Touch Icon, service worker e tela offline.

Comportamento configurado:

- Cache de assets estáticos do app.
- Fallback de navegação para o app shell em `index.html`, mantendo rotas protegidas e Supabase Auth estáveis.
- Tela informativa offline disponível em `offline.html`.
- Atualização automática e limpeza de caches antigos.
- Chamadas para `*.supabase.co` usam `NetworkOnly`, evitando cache de autenticação e dados sensíveis.
- Prompt de instalação para Chrome desktop e Android.
- Instrução específica para iPhone: Safari > Compartilhar > Adicionar à Tela de Início.

## Como Testar Instalação

Chrome desktop:

1. Rode `npm run build` e `npm run preview`.
2. Abra a URL do preview no Chrome.
3. Use o ícone de instalação na barra de endereço ou o menu do navegador.

Android Chrome:

1. Abra o app publicado em HTTPS ou uma URL local acessível pelo celular.
2. Aguarde o botão `Instalar app` aparecer ou use o menu do Chrome.
3. Confirme a instalação.

iPhone Safari:

1. Abra o app publicado em HTTPS no Safari.
2. Toque em Compartilhar.
3. Toque em Adicionar à Tela de Início.

## Offline

Ao perder conexão, o app exibe indicador visual de status e continua abrindo o
app shell já cacheado. A tela `Você está offline` fica disponível como fallback
informativo, explicando que dados já carregados continuam visíveis e que
alterações serão sincronizadas quando a internet voltar.

## Ainda Não Implementado

- Relatórios PDF
- OCR
- IA financeira
- Notificações push
- Biometria
- Face ID
