# Checklist de publicação

## 1. Proteger os dados

1. No Supabase, abra **Database > Backups** e confirme que existe um backup
   recente. Se o plano não oferecer backup automático, exporte as tabelas antes
   de alterar o schema.
2. Não apague nem recrie as tabelas existentes.

## 2. Atualizar o Supabase existente

No **SQL Editor**, execute apenas estes arquivos, em ordem:

1. `supabase/migrations/007_atomic_planning_movements.sql`
2. `supabase/migrations/008_complete_financial_integrity.sql`

O arquivo `supabase_complete_schema.sql` é destinado a uma instalação nova. Não
é necessário executá-lo inteiro sobre uma base que já recebeu as migrações
anteriores.

## 3. Configurar o Netlify

Cadastre estas variáveis no site, sem colocá-las no Git:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

O `netlify.toml` já define o build, a pasta publicada e o Node 22. O arquivo
`public/_redirects` mantém as rotas do React funcionando ao atualizar a página.

## 4. Validar antes de publicar

```bash
npm ci
npm run lint
npm test
npm run build
```

## 5. Teste rápido depois da publicação

- Entrar e sair da conta.
- Criar, editar e excluir uma transação comum.
- Aportar e retirar de uma meta e conferir o saldo da conta.
- Pagar parcialmente uma dívida.
- Criar uma compra parcelada, pagar e desfazer uma fatura.
- Gerar e desfazer uma cobrança de assinatura.
- Atualizar diretamente as rotas `/cartoes`, `/metas` e `/mais`.
- Instalar no iPhone pelo Safari e conferir a barra inferior.
