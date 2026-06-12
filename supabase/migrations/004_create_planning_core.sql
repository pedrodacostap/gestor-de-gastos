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

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goal_movements_user_id_idx on public.goal_movements(user_id);
create index if not exists goal_movements_goal_id_idx on public.goal_movements(goal_id);
create index if not exists debts_user_id_idx on public.debts(user_id);
create index if not exists debt_payments_user_id_idx on public.debt_payments(user_id);
create index if not exists debt_payments_debt_id_idx on public.debt_payments(debt_id);
create index if not exists emergency_reserve_settings_user_id_idx on public.emergency_reserve_settings(user_id);

alter table public.goals enable row level security;
alter table public.goal_movements enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.emergency_reserve_settings enable row level security;

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists set_debts_updated_at on public.debts;
create trigger set_debts_updated_at before update on public.debts
for each row execute function public.set_updated_at();

drop trigger if exists set_emergency_reserve_settings_updated_at on public.emergency_reserve_settings;
create trigger set_emergency_reserve_settings_updated_at before update on public.emergency_reserve_settings
for each row execute function public.set_updated_at();

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

create policy "Users can read own goals" on public.goals
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals
for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read own goal movements" on public.goal_movements
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own goal movements" on public.goal_movements
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals where goals.id = goal_movements.goal_id and goals.user_id = auth.uid())
);
create policy "Users can delete own goal movements" on public.goal_movements
for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read own debts" on public.debts
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own debts" on public.debts
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own debts" on public.debts
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own debts" on public.debts
for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read own debt payments" on public.debt_payments
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own debt payments" on public.debt_payments
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (select 1 from public.debts where debts.id = debt_payments.debt_id and debts.user_id = auth.uid())
);
create policy "Users can delete own debt payments" on public.debt_payments
for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read own emergency settings" on public.emergency_reserve_settings
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own emergency settings" on public.emergency_reserve_settings
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own emergency settings" on public.emergency_reserve_settings
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
