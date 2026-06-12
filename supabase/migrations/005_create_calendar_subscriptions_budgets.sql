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

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscription_charges_user_date_idx on public.subscription_charges(user_id, charge_date);
create index if not exists budgets_user_month_idx on public.budgets(user_id, month);
create index if not exists budget_history_user_month_idx on public.budget_history(user_id, month);

alter table public.subscriptions enable row level security;
alter table public.subscription_charges enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_history enable row level security;

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at before update on public.budgets
for each row execute function public.set_updated_at();

create policy "Users can read own subscriptions" on public.subscriptions
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on public.subscriptions
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own subscriptions" on public.subscriptions
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own subscriptions" on public.subscriptions
for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read own subscription charges" on public.subscription_charges
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own subscription charges" on public.subscription_charges
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.subscriptions where subscriptions.id = subscription_charges.subscription_id and subscriptions.user_id = auth.uid())
);
create policy "Users can update own subscription charges" on public.subscription_charges
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own subscription charges" on public.subscription_charges
for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read own budgets" on public.budgets
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.categories where categories.id = budgets.category_id and categories.user_id = auth.uid())
);
create policy "Users can update own budgets" on public.budgets
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets
for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read own budget history" on public.budget_history
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own budget history" on public.budget_history
for insert to authenticated with check (auth.uid() = user_id);
