create extension if not exists pgcrypto with schema extensions;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank text,
  type text not null,
  initial_balance numeric not null default 0,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  type text not null check (type in ('income', 'expense')),
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  category_id uuid references public.categories(id),
  title text not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  payment_method text,
  transaction_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_account_id_idx on public.transactions(account_id);
create index if not exists transactions_category_id_idx on public.transactions(category_id);
create index if not exists transactions_date_idx on public.transactions(transaction_date);
create unique index if not exists categories_user_name_type_unique
on public.categories(user_id, lower(name), type);

alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

drop policy if exists "Users can read own accounts" on public.accounts;
drop policy if exists "Users can insert own accounts" on public.accounts;
drop policy if exists "Users can update own accounts" on public.accounts;
drop policy if exists "Users can delete own accounts" on public.accounts;

create policy "Users can read own accounts"
on public.accounts
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own accounts"
on public.accounts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own accounts"
on public.accounts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own accounts"
on public.accounts
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own categories" on public.categories;
drop policy if exists "Users can insert own categories" on public.categories;
drop policy if exists "Users can update own categories" on public.categories;
drop policy if exists "Users can delete own categories" on public.categories;

create policy "Users can read own categories"
on public.categories
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own categories"
on public.categories
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own categories"
on public.categories
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own categories"
on public.categories
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;

create policy "Users can read own transactions"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own transactions"
on public.transactions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.accounts
    where accounts.id = transactions.account_id
    and accounts.user_id = auth.uid()
  )
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = transactions.category_id
      and categories.user_id = auth.uid()
    )
  )
);

create policy "Users can update own transactions"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.accounts
    where accounts.id = transactions.account_id
    and accounts.user_id = auth.uid()
  )
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = transactions.category_id
      and categories.user_id = auth.uid()
    )
  )
);

create policy "Users can delete own transactions"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.seed_default_categories(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, type, color)
  values
    (target_user_id, 'Salário', 'briefcase', 'income', '#30d158'),
    (target_user_id, 'Freelance', 'sparkles', 'income', '#64d2ff'),
    (target_user_id, 'Alimentação', 'utensils', 'expense', '#ff9f0a'),
    (target_user_id, 'Moradia', 'home', 'expense', '#0a84ff'),
    (target_user_id, 'Transporte', 'car', 'expense', '#bf5af2'),
    (target_user_id, 'Saúde', 'heart-pulse', 'expense', '#ff453a'),
    (target_user_id, 'Lazer', 'ticket', 'expense', '#ff375f'),
    (target_user_id, 'Educação', 'graduation-cap', 'expense', '#ffd60a')
  on conflict do nothing;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
  set email = excluded.email;

  perform public.seed_default_categories(new.id);

  return new;
end;
$$;
