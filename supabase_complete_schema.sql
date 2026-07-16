create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text,
  credit_limit numeric not null default 0,
  closing_day integer not null check (closing_day between 1 and 31),
  due_day integer not null check (due_day between 1 and 31),
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_card_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.credit_cards(id) on delete cascade,
  category_id uuid references public.categories(id),
  description text not null,
  total_amount numeric not null,
  purchase_date date not null,
  installments_count integer not null default 1 check (installments_count > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_card_installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purchase_id uuid not null references public.credit_card_purchases(id) on delete cascade,
  card_id uuid not null references public.credit_cards(id) on delete cascade,
  installment_number integer not null check (installment_number > 0),
  amount numeric not null,
  competence_month date not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (purchase_id, installment_number)
);

create table if not exists public.credit_card_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.credit_cards(id) on delete cascade,
  account_id uuid not null references public.accounts(id),
  invoice_month date not null,
  amount numeric not null,
  paid_at timestamptz not null default now(),
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (card_id, invoice_month)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  target_date date,
  icon text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  account_id uuid references public.accounts(id),
  transaction_id uuid references public.transactions(id) on delete set null,
  type text not null check (type in ('deposit', 'withdrawal')),
  amount numeric not null,
  movement_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  creditor text,
  original_amount numeric not null default 0,
  remaining_balance numeric not null default 0,
  monthly_interest_rate numeric not null default 0,
  installment_amount numeric not null default 0,
  due_day integer not null check (due_day between 1 and 31),
  installments_count integer not null default 1 check (installments_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  account_id uuid references public.accounts(id),
  transaction_id uuid references public.transactions(id) on delete set null,
  amount numeric not null,
  payment_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.emergency_reserve_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  target_months integer not null default 6 check (target_months in (3, 6, 9, 12)),
  linked_goal_id uuid references public.goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id),
  category_id uuid references public.categories(id),
  name text not null,
  amount numeric not null default 0,
  billing_day integer not null check (billing_day between 1 and 31),
  recurrence text not null default 'monthly' check (recurrence in ('monthly', 'quarterly', 'yearly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_charges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  account_id uuid references public.accounts(id),
  category_id uuid references public.categories(id),
  amount numeric not null,
  charge_date date not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (subscription_id, charge_date)
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month date not null,
  amount numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create table if not exists public.budget_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  month date not null,
  budget_amount numeric not null,
  used_amount numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create unique index if not exists categories_user_name_type_unique on public.categories(user_id, lower(name), type);
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_account_id_idx on public.transactions(account_id);
create index if not exists transactions_category_id_idx on public.transactions(category_id);
create index if not exists transactions_date_idx on public.transactions(transaction_date);
create index if not exists credit_cards_user_id_idx on public.credit_cards(user_id);
create index if not exists credit_card_purchases_user_id_idx on public.credit_card_purchases(user_id);
create index if not exists credit_card_purchases_card_id_idx on public.credit_card_purchases(card_id);
create index if not exists credit_card_installments_user_id_idx on public.credit_card_installments(user_id);
create index if not exists credit_card_installments_card_month_idx on public.credit_card_installments(card_id, competence_month);
create index if not exists credit_card_invoice_payments_user_id_idx on public.credit_card_invoice_payments(user_id);
create index if not exists credit_card_invoice_payments_card_month_idx on public.credit_card_invoice_payments(card_id, invoice_month);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goal_movements_user_id_idx on public.goal_movements(user_id);
create index if not exists goal_movements_goal_id_idx on public.goal_movements(goal_id);
create index if not exists debts_user_id_idx on public.debts(user_id);
create index if not exists debt_payments_user_id_idx on public.debt_payments(user_id);
create index if not exists debt_payments_debt_id_idx on public.debt_payments(debt_id);
create index if not exists emergency_reserve_settings_user_id_idx on public.emergency_reserve_settings(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscription_charges_user_date_idx on public.subscription_charges(user_id, charge_date);
create index if not exists budgets_user_month_idx on public.budgets(user_id, month);
create index if not exists budget_history_user_month_idx on public.budget_history(user_id, month);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.credit_cards to authenticated;
grant select, insert, update, delete on public.credit_card_purchases to authenticated;
grant select, insert, update, delete on public.credit_card_installments to authenticated;
grant select, insert, update, delete on public.credit_card_invoice_payments to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.goal_movements to authenticated;
grant select, insert, update, delete on public.debts to authenticated;
grant select, insert, update, delete on public.debt_payments to authenticated;
grant select, insert, update, delete on public.emergency_reserve_settings to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.subscription_charges to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
grant select, insert, update, delete on public.budget_history to authenticated;

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.credit_cards enable row level security;
alter table public.credit_card_purchases enable row level security;
alter table public.credit_card_installments enable row level security;
alter table public.credit_card_invoice_payments enable row level security;
alter table public.goals enable row level security;
alter table public.goal_movements enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.emergency_reserve_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_charges enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_history enable row level security;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_accounts_updated_at on public.accounts;
create trigger set_accounts_updated_at before update on public.accounts for each row execute function public.set_updated_at();
drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
drop trigger if exists set_credit_cards_updated_at on public.credit_cards;
create trigger set_credit_cards_updated_at before update on public.credit_cards for each row execute function public.set_updated_at();
drop trigger if exists set_credit_card_purchases_updated_at on public.credit_card_purchases;
create trigger set_credit_card_purchases_updated_at before update on public.credit_card_purchases for each row execute function public.set_updated_at();
drop trigger if exists set_credit_card_installments_updated_at on public.credit_card_installments;
create trigger set_credit_card_installments_updated_at before update on public.credit_card_installments for each row execute function public.set_updated_at();
drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at before update on public.goals for each row execute function public.set_updated_at();
drop trigger if exists set_debts_updated_at on public.debts;
create trigger set_debts_updated_at before update on public.debts for each row execute function public.set_updated_at();
drop trigger if exists set_emergency_reserve_settings_updated_at on public.emergency_reserve_settings;
create trigger set_emergency_reserve_settings_updated_at before update on public.emergency_reserve_settings for each row execute function public.set_updated_at();
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();

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

create or replace function public.create_default_emergency_reserve_settings(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.emergency_reserve_settings (user_id, target_months)
  values (target_user_id, 6)
  on conflict (user_id) do nothing;
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
  perform public.create_default_emergency_reserve_settings(new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can delete own profile" on public.profiles for delete to authenticated using (auth.uid() = id);

drop policy if exists "Users can read own accounts" on public.accounts;
drop policy if exists "Users can insert own accounts" on public.accounts;
drop policy if exists "Users can update own accounts" on public.accounts;
drop policy if exists "Users can delete own accounts" on public.accounts;
create policy "Users can read own accounts" on public.accounts for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own accounts" on public.accounts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own accounts" on public.accounts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own accounts" on public.accounts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own categories" on public.categories;
drop policy if exists "Users can insert own categories" on public.categories;
drop policy if exists "Users can update own categories" on public.categories;
drop policy if exists "Users can delete own categories" on public.categories;
create policy "Users can read own categories" on public.categories for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.categories for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can read own transactions" on public.transactions for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.accounts where accounts.id = transactions.account_id and accounts.user_id = auth.uid())
  and (category_id is null or exists (select 1 from public.categories where categories.id = transactions.category_id and categories.user_id = auth.uid()))
);
create policy "Users can update own transactions" on public.transactions for update to authenticated using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (select 1 from public.accounts where accounts.id = transactions.account_id and accounts.user_id = auth.uid())
  and (category_id is null or exists (select 1 from public.categories where categories.id = transactions.category_id and categories.user_id = auth.uid()))
);
create policy "Users can delete own transactions" on public.transactions for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own credit cards" on public.credit_cards;
drop policy if exists "Users can insert own credit cards" on public.credit_cards;
drop policy if exists "Users can update own credit cards" on public.credit_cards;
drop policy if exists "Users can delete own credit cards" on public.credit_cards;
create policy "Users can read own credit cards" on public.credit_cards for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own credit cards" on public.credit_cards for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own credit cards" on public.credit_cards for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own credit cards" on public.credit_cards for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own credit purchases" on public.credit_card_purchases;
drop policy if exists "Users can insert own credit purchases" on public.credit_card_purchases;
drop policy if exists "Users can update own credit purchases" on public.credit_card_purchases;
drop policy if exists "Users can delete own credit purchases" on public.credit_card_purchases;
create policy "Users can read own credit purchases" on public.credit_card_purchases for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own credit purchases" on public.credit_card_purchases for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.credit_cards where credit_cards.id = credit_card_purchases.card_id and credit_cards.user_id = auth.uid())
  and (category_id is null or exists (select 1 from public.categories where categories.id = credit_card_purchases.category_id and categories.user_id = auth.uid()))
);
create policy "Users can update own credit purchases" on public.credit_card_purchases for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own credit purchases" on public.credit_card_purchases for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own credit installments" on public.credit_card_installments;
drop policy if exists "Users can insert own credit installments" on public.credit_card_installments;
drop policy if exists "Users can update own credit installments" on public.credit_card_installments;
drop policy if exists "Users can delete own credit installments" on public.credit_card_installments;
create policy "Users can read own credit installments" on public.credit_card_installments for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own credit installments" on public.credit_card_installments for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.credit_card_purchases where credit_card_purchases.id = credit_card_installments.purchase_id and credit_card_purchases.user_id = auth.uid())
);
create policy "Users can update own credit installments" on public.credit_card_installments for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own credit installments" on public.credit_card_installments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own invoice payments" on public.credit_card_invoice_payments;
drop policy if exists "Users can insert own invoice payments" on public.credit_card_invoice_payments;
drop policy if exists "Users can update own invoice payments" on public.credit_card_invoice_payments;
drop policy if exists "Users can delete own invoice payments" on public.credit_card_invoice_payments;
create policy "Users can read own invoice payments" on public.credit_card_invoice_payments for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own invoice payments" on public.credit_card_invoice_payments for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.credit_cards where credit_cards.id = credit_card_invoice_payments.card_id and credit_cards.user_id = auth.uid())
  and exists (select 1 from public.accounts where accounts.id = credit_card_invoice_payments.account_id and accounts.user_id = auth.uid())
);
create policy "Users can update own invoice payments" on public.credit_card_invoice_payments for update to authenticated using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (select 1 from public.credit_cards where credit_cards.id = credit_card_invoice_payments.card_id and credit_cards.user_id = auth.uid())
  and exists (select 1 from public.accounts where accounts.id = credit_card_invoice_payments.account_id and accounts.user_id = auth.uid())
);
create policy "Users can delete own invoice payments" on public.credit_card_invoice_payments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own goals" on public.goals;
drop policy if exists "Users can insert own goals" on public.goals;
drop policy if exists "Users can update own goals" on public.goals;
drop policy if exists "Users can delete own goals" on public.goals;
create policy "Users can read own goals" on public.goals for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own goal movements" on public.goal_movements;
drop policy if exists "Users can insert own goal movements" on public.goal_movements;
drop policy if exists "Users can update own goal movements" on public.goal_movements;
drop policy if exists "Users can delete own goal movements" on public.goal_movements;
create policy "Users can read own goal movements" on public.goal_movements for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own goal movements" on public.goal_movements for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals where goals.id = goal_movements.goal_id and goals.user_id = auth.uid())
);
create policy "Users can update own goal movements" on public.goal_movements for update to authenticated using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals where goals.id = goal_movements.goal_id and goals.user_id = auth.uid())
);
create policy "Users can delete own goal movements" on public.goal_movements for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own debts" on public.debts;
drop policy if exists "Users can insert own debts" on public.debts;
drop policy if exists "Users can update own debts" on public.debts;
drop policy if exists "Users can delete own debts" on public.debts;
create policy "Users can read own debts" on public.debts for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own debts" on public.debts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own debts" on public.debts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own debts" on public.debts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own debt payments" on public.debt_payments;
drop policy if exists "Users can insert own debt payments" on public.debt_payments;
drop policy if exists "Users can update own debt payments" on public.debt_payments;
drop policy if exists "Users can delete own debt payments" on public.debt_payments;
create policy "Users can read own debt payments" on public.debt_payments for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own debt payments" on public.debt_payments for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.debts where debts.id = debt_payments.debt_id and debts.user_id = auth.uid())
);
create policy "Users can update own debt payments" on public.debt_payments for update to authenticated using (auth.uid() = user_id) with check (
  auth.uid() = user_id
  and exists (select 1 from public.debts where debts.id = debt_payments.debt_id and debts.user_id = auth.uid())
);
create policy "Users can delete own debt payments" on public.debt_payments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own emergency settings" on public.emergency_reserve_settings;
drop policy if exists "Users can insert own emergency settings" on public.emergency_reserve_settings;
drop policy if exists "Users can update own emergency settings" on public.emergency_reserve_settings;
drop policy if exists "Users can delete own emergency settings" on public.emergency_reserve_settings;
create policy "Users can read own emergency settings" on public.emergency_reserve_settings for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own emergency settings" on public.emergency_reserve_settings for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own emergency settings" on public.emergency_reserve_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own emergency settings" on public.emergency_reserve_settings for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own subscriptions" on public.subscriptions;
drop policy if exists "Users can insert own subscriptions" on public.subscriptions;
drop policy if exists "Users can update own subscriptions" on public.subscriptions;
drop policy if exists "Users can delete own subscriptions" on public.subscriptions;
create policy "Users can read own subscriptions" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on public.subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own subscriptions" on public.subscriptions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own subscriptions" on public.subscriptions for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own subscription charges" on public.subscription_charges;
drop policy if exists "Users can insert own subscription charges" on public.subscription_charges;
drop policy if exists "Users can update own subscription charges" on public.subscription_charges;
drop policy if exists "Users can delete own subscription charges" on public.subscription_charges;
create policy "Users can read own subscription charges" on public.subscription_charges for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own subscription charges" on public.subscription_charges for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.subscriptions where subscriptions.id = subscription_charges.subscription_id and subscriptions.user_id = auth.uid())
);
create policy "Users can update own subscription charges" on public.subscription_charges for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own subscription charges" on public.subscription_charges for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own budgets" on public.budgets;
drop policy if exists "Users can insert own budgets" on public.budgets;
drop policy if exists "Users can update own budgets" on public.budgets;
drop policy if exists "Users can delete own budgets" on public.budgets;
create policy "Users can read own budgets" on public.budgets for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.categories where categories.id = budgets.category_id and categories.user_id = auth.uid())
);
create policy "Users can update own budgets" on public.budgets for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own budget history" on public.budget_history;
drop policy if exists "Users can insert own budget history" on public.budget_history;
drop policy if exists "Users can update own budget history" on public.budget_history;
drop policy if exists "Users can delete own budget history" on public.budget_history;
create policy "Users can read own budget history" on public.budget_history for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own budget history" on public.budget_history for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own budget history" on public.budget_history for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own budget history" on public.budget_history for delete to authenticated using (auth.uid() = user_id);

select public.seed_default_categories(id) from auth.users;
select public.create_default_emergency_reserve_settings(id) from auth.users;

-- Movimentações financeiras compostas devem ser atômicas para que conta,
-- meta/dívida e histórico nunca fiquem divergentes.
create or replace function public.create_goal_movement(
  p_goal_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_movement_date date,
  p_notes text,
  p_type text
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  target_goal public.goals%rowtype;
  transaction_id uuid;
  movement_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'O valor da movimentação deve ser maior que zero.';
  end if;

  if p_movement_date > current_date then
    raise exception 'A data da movimentação da meta não pode estar no futuro.';
  end if;

  if p_type not in ('deposit', 'withdrawal') then
    raise exception 'Tipo de movimentação inválido.';
  end if;

  select *
  into target_goal
  from public.goals
  where id = p_goal_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Meta não encontrada.';
  end if;

  if p_type = 'withdrawal' and p_amount > target_goal.current_amount then
    raise exception 'A retirada não pode ser maior que o valor atual da meta.';
  end if;

  if p_account_id is not null then
    if not exists (
      select 1 from public.accounts
      where id = p_account_id and user_id = auth.uid()
    ) then
      raise exception 'Conta não encontrada.';
    end if;

    insert into public.transactions (
      user_id,
      account_id,
      category_id,
      title,
      amount,
      type,
      payment_method,
      transaction_date,
      notes
    )
    values (
      auth.uid(),
      p_account_id,
      null,
      case
        when p_type = 'deposit' then 'Aporte em meta: ' || target_goal.name
        else 'Retirada de meta: ' || target_goal.name
      end,
      p_amount,
      case when p_type = 'deposit' then 'expense' else 'income' end,
      'goal_movement',
      p_movement_date,
      nullif(p_notes, '')
    )
    returning id into transaction_id;
  end if;

  update public.goals
  set current_amount = current_amount + case
    when p_type = 'deposit' then p_amount
    else -p_amount
  end
  where id = p_goal_id and user_id = auth.uid();

  insert into public.goal_movements (
    user_id,
    goal_id,
    account_id,
    transaction_id,
    type,
    amount,
    movement_date,
    notes
  )
  values (
    auth.uid(),
    p_goal_id,
    p_account_id,
    transaction_id,
    p_type,
    p_amount,
    p_movement_date,
    nullif(p_notes, '')
  )
  returning id into movement_id;

  return movement_id;
end;
$$;

create or replace function public.create_debt_payment(
  p_debt_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_payment_date date,
  p_notes text
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  target_debt public.debts%rowtype;
  payment_amount numeric;
  transaction_id uuid;
  payment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'O valor do pagamento deve ser maior que zero.';
  end if;

  if p_payment_date > current_date then
    raise exception 'A data do pagamento não pode estar no futuro.';
  end if;

  select *
  into target_debt
  from public.debts
  where id = p_debt_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Dívida não encontrada.';
  end if;

  if target_debt.remaining_balance <= 0 then
    raise exception 'Esta dívida já está quitada.';
  end if;

  if not exists (
    select 1 from public.accounts
    where id = p_account_id and user_id = auth.uid()
  ) then
    raise exception 'Conta não encontrada.';
  end if;

  payment_amount := least(p_amount, target_debt.remaining_balance);

  insert into public.transactions (
    user_id,
    account_id,
    category_id,
    title,
    amount,
    type,
    payment_method,
    transaction_date,
    notes
  )
  values (
    auth.uid(),
    p_account_id,
    null,
    'Pagamento dívida: ' || target_debt.name,
    payment_amount,
    'expense',
    'debt_payment',
    p_payment_date,
    nullif(p_notes, '')
  )
  returning id into transaction_id;

  update public.debts
  set remaining_balance = remaining_balance - payment_amount
  where id = p_debt_id and user_id = auth.uid();

  insert into public.debt_payments (
    user_id,
    debt_id,
    account_id,
    transaction_id,
    amount,
    payment_date,
    notes
  )
  values (
    auth.uid(),
    p_debt_id,
    p_account_id,
    transaction_id,
    payment_amount,
    p_payment_date,
    nullif(p_notes, '')
  )
  returning id into payment_id;

  return payment_id;
end;
$$;

revoke all on function public.create_goal_movement(uuid, uuid, numeric, date, text, text) from public;
revoke all on function public.create_debt_payment(uuid, uuid, numeric, date, text) from public;
grant execute on function public.create_goal_movement(uuid, uuid, numeric, date, text, text) to authenticated;
grant execute on function public.create_debt_payment(uuid, uuid, numeric, date, text) to authenticated;

-- Integridade atômica de cartões, faturas, assinaturas e transações vinculadas.
create or replace function public.rebuild_credit_card_installments(p_purchase_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  purchase_record public.credit_card_purchases%rowtype;
  card_closing_day integer;
  first_month date;
  base_amount numeric;
  installment_amount numeric;
  installment_index integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select *
  into purchase_record
  from public.credit_card_purchases
  where id = p_purchase_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Compra não encontrada.';
  end if;

  select closing_day
  into card_closing_day
  from public.credit_cards
  where id = purchase_record.card_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Cartão não encontrado.';
  end if;

  if exists (
    select 1 from public.credit_card_installments
    where purchase_id = p_purchase_id and status = 'paid'
  ) then
    raise exception 'Esta compra tem parcelas pagas. Desfaça o pagamento da fatura antes de editar.';
  end if;

  if purchase_record.total_amount <= 0 or purchase_record.installments_count <= 0 then
    raise exception 'Valor e quantidade de parcelas devem ser maiores que zero.';
  end if;

  delete from public.credit_card_installments
  where purchase_id = p_purchase_id and user_id = auth.uid();

  first_month := date_trunc('month', purchase_record.purchase_date)::date;
  if extract(day from purchase_record.purchase_date) > card_closing_day then
    first_month := (first_month + interval '1 month')::date;
  end if;

  base_amount := round(purchase_record.total_amount / purchase_record.installments_count, 2);

  for installment_index in 1..purchase_record.installments_count loop
    installment_amount := case
      when installment_index = purchase_record.installments_count
        then purchase_record.total_amount - base_amount * (purchase_record.installments_count - 1)
      else base_amount
    end;

    insert into public.credit_card_installments (
      user_id,
      purchase_id,
      card_id,
      installment_number,
      amount,
      competence_month,
      status
    )
    values (
      auth.uid(),
      purchase_record.id,
      purchase_record.card_id,
      installment_index,
      installment_amount,
      (first_month + make_interval(months => installment_index - 1))::date,
      'pending'
    );
  end loop;
end;
$$;

create or replace function public.create_credit_card_purchase(
  p_card_id uuid,
  p_category_id uuid,
  p_description text,
  p_installments_count integer,
  p_notes text,
  p_purchase_date date,
  p_total_amount numeric
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  purchase_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if nullif(trim(p_description), '') is null then
    raise exception 'Informe a descrição da compra.';
  end if;

  if p_total_amount is null or p_total_amount <= 0 or p_installments_count is null or p_installments_count <= 0 then
    raise exception 'Valor e quantidade de parcelas devem ser maiores que zero.';
  end if;

  if p_purchase_date > current_date then
    raise exception 'A data da compra não pode estar no futuro.';
  end if;

  if not exists (select 1 from public.credit_cards where id = p_card_id and user_id = auth.uid()) then
    raise exception 'Cartão não encontrado.';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and user_id = auth.uid()
  ) then
    raise exception 'Categoria não encontrada.';
  end if;

  insert into public.credit_card_purchases (
    user_id, card_id, category_id, description, total_amount,
    purchase_date, installments_count, notes
  )
  values (
    auth.uid(), p_card_id, p_category_id, trim(p_description), p_total_amount,
    p_purchase_date, p_installments_count, nullif(p_notes, '')
  )
  returning id into purchase_id;

  perform public.rebuild_credit_card_installments(purchase_id);
  return purchase_id;
end;
$$;

create or replace function public.update_credit_card_purchase(
  p_purchase_id uuid,
  p_card_id uuid,
  p_category_id uuid,
  p_description text,
  p_installments_count integer,
  p_notes text,
  p_purchase_date date,
  p_total_amount numeric
)
returns void
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if nullif(trim(p_description), '') is null then
    raise exception 'Informe a descrição da compra.';
  end if;

  if p_total_amount is null or p_total_amount <= 0 or p_installments_count is null or p_installments_count <= 0 then
    raise exception 'Valor e quantidade de parcelas devem ser maiores que zero.';
  end if;

  if p_purchase_date > current_date then
    raise exception 'A data da compra não pode estar no futuro.';
  end if;

  if not exists (select 1 from public.credit_cards where id = p_card_id and user_id = auth.uid()) then
    raise exception 'Cartão não encontrado.';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and user_id = auth.uid()
  ) then
    raise exception 'Categoria não encontrada.';
  end if;

  perform 1 from public.credit_card_purchases
  where id = p_purchase_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Compra não encontrada.';
  end if;

  if exists (
    select 1 from public.credit_card_installments
    where purchase_id = p_purchase_id and status = 'paid'
  ) then
    raise exception 'Esta compra tem parcelas pagas. Desfaça o pagamento da fatura antes de editar.';
  end if;

  update public.credit_card_purchases
  set card_id = p_card_id,
      category_id = p_category_id,
      description = trim(p_description),
      installments_count = p_installments_count,
      notes = nullif(p_notes, ''),
      purchase_date = p_purchase_date,
      total_amount = p_total_amount
  where id = p_purchase_id and user_id = auth.uid();

  perform public.rebuild_credit_card_installments(p_purchase_id);
end;
$$;

create or replace function public.delete_credit_card_purchase(p_purchase_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  perform 1 from public.credit_card_purchases
  where id = p_purchase_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Compra não encontrada.';
  end if;

  if exists (
    select 1 from public.credit_card_installments
    where purchase_id = p_purchase_id and status = 'paid'
  ) then
    raise exception 'Esta compra tem parcelas pagas. Desfaça o pagamento da fatura antes de excluir.';
  end if;

  delete from public.credit_card_purchases
  where id = p_purchase_id and user_id = auth.uid();
end;
$$;

create or replace function public.pay_credit_card_invoice(
  p_account_id uuid,
  p_card_id uuid,
  p_expected_total numeric,
  p_invoice_month date,
  p_paid_at timestamptz
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  card_record public.credit_cards%rowtype;
  normalized_invoice_month date := date_trunc('month', p_invoice_month)::date;
  invoice_total numeric;
  transaction_id uuid;
  payment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into card_record from public.credit_cards
  where id = p_card_id and user_id = auth.uid();
  if not found then
    raise exception 'Cartão não encontrado.';
  end if;

  if not exists (select 1 from public.accounts where id = p_account_id and user_id = auth.uid()) then
    raise exception 'Conta não encontrada.';
  end if;

  if exists (
    select 1 from public.credit_card_invoice_payments
    where card_id = p_card_id and invoice_month = normalized_invoice_month
  ) then
    raise exception 'Esta fatura já foi paga.';
  end if;

  perform 1 from public.credit_card_installments
  where card_id = p_card_id
    and competence_month = normalized_invoice_month
    and user_id = auth.uid()
  for update;

  select coalesce(sum(amount), 0)
  into invoice_total
  from public.credit_card_installments
  where card_id = p_card_id
    and competence_month = normalized_invoice_month
    and status = 'pending'
    and user_id = auth.uid();

  if invoice_total <= 0 then
    raise exception 'Esta fatura não possui parcelas pendentes.';
  end if;

  if p_expected_total is null or abs(invoice_total - p_expected_total) > 0.005 then
    raise exception 'O valor da fatura foi atualizado. Recarregue a tela antes de pagar.';
  end if;

  insert into public.transactions (
    user_id, account_id, category_id, title, amount, type,
    payment_method, transaction_date, notes
  )
  values (
    auth.uid(), p_account_id, null,
    'Fatura ' || card_record.name || ' ' || to_char(normalized_invoice_month, 'YYYY-MM'),
    invoice_total, 'expense', 'credit_card_invoice', p_paid_at::date,
    'Pagamento da fatura ' || to_char(normalized_invoice_month, 'YYYY-MM')
  )
  returning id into transaction_id;

  insert into public.credit_card_invoice_payments (
    user_id, card_id, account_id, invoice_month, amount, paid_at, transaction_id
  )
  values (
    auth.uid(), p_card_id, p_account_id, normalized_invoice_month,
    invoice_total, p_paid_at, transaction_id
  )
  returning id into payment_id;

  update public.credit_card_installments
  set status = 'paid'
  where card_id = p_card_id
    and competence_month = normalized_invoice_month
    and status = 'pending'
    and user_id = auth.uid();

  return payment_id;
end;
$$;

create or replace function public.reverse_credit_card_invoice_payment(p_payment_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  payment_record public.credit_card_invoice_payments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into payment_record
  from public.credit_card_invoice_payments
  where id = p_payment_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Pagamento não encontrado.';
  end if;

  update public.credit_card_installments
  set status = 'pending'
  where card_id = payment_record.card_id
    and competence_month = payment_record.invoice_month
    and user_id = auth.uid();

  delete from public.credit_card_invoice_payments
  where id = payment_record.id and user_id = auth.uid();

  if payment_record.transaction_id is not null then
    delete from public.transactions
    where id = payment_record.transaction_id and user_id = auth.uid();
  end if;
end;
$$;

create or replace function public.create_subscription_charge(
  p_subscription_id uuid,
  p_charge_date date
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  subscription_record public.subscriptions%rowtype;
  transaction_id uuid;
  charge_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into subscription_record
  from public.subscriptions
  where id = p_subscription_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Assinatura não encontrada.';
  end if;

  if not subscription_record.is_active then
    raise exception 'Esta assinatura está cancelada.';
  end if;

  if subscription_record.amount <= 0 then
    raise exception 'O valor da assinatura deve ser maior que zero.';
  end if;

  if exists (
    select 1 from public.subscription_charges
    where subscription_id = p_subscription_id and charge_date = p_charge_date
  ) then
    raise exception 'Esta cobrança já foi gerada.';
  end if;

  if subscription_record.account_id is not null then
    if not exists (
      select 1 from public.accounts
      where id = subscription_record.account_id and user_id = auth.uid()
    ) then
      raise exception 'Conta não encontrada.';
    end if;

    insert into public.transactions (
      user_id, account_id, category_id, title, amount, type,
      payment_method, transaction_date, notes
    )
    values (
      auth.uid(), subscription_record.account_id, subscription_record.category_id,
      subscription_record.name, subscription_record.amount, 'expense',
      'subscription', p_charge_date,
      'Cobrança automática de ' || subscription_record.name
    )
    returning id into transaction_id;
  end if;

  insert into public.subscription_charges (
    user_id, subscription_id, account_id, category_id, amount,
    charge_date, status, transaction_id
  )
  values (
    auth.uid(), subscription_record.id, subscription_record.account_id,
    subscription_record.category_id, subscription_record.amount, p_charge_date,
    case when transaction_id is null then 'pending' else 'paid' end,
    transaction_id
  )
  returning id into charge_id;

  return charge_id;
end;
$$;

create or replace function public.reverse_subscription_charge(p_charge_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  charge_record public.subscription_charges%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into charge_record
  from public.subscription_charges
  where id = p_charge_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception 'Cobrança não encontrada.';
  end if;

  delete from public.subscription_charges
  where id = charge_record.id and user_id = auth.uid();

  if charge_record.transaction_id is not null then
    delete from public.transactions
    where id = charge_record.transaction_id and user_id = auth.uid();
  end if;
end;
$$;

create or replace function public.delete_goal_safely(p_goal_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.goal_movements
    where goal_id = p_goal_id and user_id = auth.uid()
  ) then
    raise exception 'Esta meta possui movimentações. Preserve o histórico ou reverta as movimentações antes de excluir.';
  end if;

  delete from public.goals where id = p_goal_id and user_id = auth.uid();
  if not found then raise exception 'Meta não encontrada.'; end if;
end;
$$;

create or replace function public.delete_debt_safely(p_debt_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1 from public.debt_payments
    where debt_id = p_debt_id and user_id = auth.uid()
  ) then
    raise exception 'Esta dívida possui pagamentos. Preserve o histórico antes de excluir.';
  end if;

  delete from public.debts where id = p_debt_id and user_id = auth.uid();
  if not found then raise exception 'Dívida não encontrada.'; end if;
end;
$$;

create or replace function public.protect_linked_financial_transaction()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (select 1 from public.goal_movements where transaction_id = old.id)
    or exists (select 1 from public.debt_payments where transaction_id = old.id)
    or exists (select 1 from public.credit_card_invoice_payments where transaction_id = old.id)
    or exists (select 1 from public.subscription_charges where transaction_id = old.id)
  then
    raise exception 'Esta transação foi gerada por outro módulo. Edite ou reverta a operação no módulo de origem.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_linked_financial_transaction on public.transactions;
create trigger protect_linked_financial_transaction
before update or delete on public.transactions
for each row execute function public.protect_linked_financial_transaction();

revoke all on function public.rebuild_credit_card_installments(uuid) from public;
revoke all on function public.create_credit_card_purchase(uuid, uuid, text, integer, text, date, numeric) from public;
revoke all on function public.update_credit_card_purchase(uuid, uuid, uuid, text, integer, text, date, numeric) from public;
revoke all on function public.delete_credit_card_purchase(uuid) from public;
revoke all on function public.pay_credit_card_invoice(uuid, uuid, numeric, date, timestamptz) from public;
revoke all on function public.reverse_credit_card_invoice_payment(uuid) from public;
revoke all on function public.create_subscription_charge(uuid, date) from public;
revoke all on function public.reverse_subscription_charge(uuid) from public;
revoke all on function public.delete_goal_safely(uuid) from public;
revoke all on function public.delete_debt_safely(uuid) from public;

grant execute on function public.rebuild_credit_card_installments(uuid) to authenticated;
grant execute on function public.create_credit_card_purchase(uuid, uuid, text, integer, text, date, numeric) to authenticated;
grant execute on function public.update_credit_card_purchase(uuid, uuid, uuid, text, integer, text, date, numeric) to authenticated;
grant execute on function public.delete_credit_card_purchase(uuid) to authenticated;
grant execute on function public.pay_credit_card_invoice(uuid, uuid, numeric, date, timestamptz) to authenticated;
grant execute on function public.reverse_credit_card_invoice_payment(uuid) to authenticated;
grant execute on function public.create_subscription_charge(uuid, date) to authenticated;
grant execute on function public.reverse_subscription_charge(uuid) to authenticated;
grant execute on function public.delete_goal_safely(uuid) to authenticated;
grant execute on function public.delete_debt_safely(uuid) to authenticated;
