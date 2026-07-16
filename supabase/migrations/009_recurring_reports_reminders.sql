create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  payment_method text,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  interval_count integer not null default 1 check (interval_count between 1 and 120),
  start_date date not null,
  next_due_date date not null,
  end_date date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (next_due_date >= start_date),
  check (end_date is null or end_date >= start_date)
);

create table if not exists public.recurring_transaction_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recurring_transaction_id uuid not null references public.recurring_transactions(id) on delete restrict,
  transaction_id uuid not null unique references public.transactions(id) on delete restrict,
  due_date date not null,
  created_at timestamptz not null default now(),
  unique (recurring_transaction_id, due_date)
);

create table if not exists public.financial_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  due_date date not null,
  amount numeric check (amount is null or amount >= 0),
  kind text not null default 'manual' check (kind in ('manual', 'bill', 'goal', 'tax', 'other')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'dismissed')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_transactions_user_due_idx
on public.recurring_transactions(user_id, is_active, next_due_date);

create index if not exists recurring_occurrences_user_due_idx
on public.recurring_transaction_occurrences(user_id, due_date desc);

create index if not exists financial_reminders_user_due_idx
on public.financial_reminders(user_id, status, due_date);

alter table public.recurring_transactions enable row level security;
alter table public.recurring_transaction_occurrences enable row level security;
alter table public.financial_reminders enable row level security;

drop trigger if exists set_recurring_transactions_updated_at on public.recurring_transactions;
create trigger set_recurring_transactions_updated_at
before update on public.recurring_transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_financial_reminders_updated_at on public.financial_reminders;
create trigger set_financial_reminders_updated_at
before update on public.financial_reminders
for each row execute function public.set_updated_at();

create policy "Users can read own recurring transactions"
on public.recurring_transactions for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own recurring transactions"
on public.recurring_transactions for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.accounts
    where accounts.id = recurring_transactions.account_id
      and accounts.user_id = auth.uid()
  )
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = recurring_transactions.category_id
        and categories.user_id = auth.uid()
        and categories.type = recurring_transactions.type
    )
  )
);

create policy "Users can update own recurring transactions"
on public.recurring_transactions for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.accounts
    where accounts.id = recurring_transactions.account_id
      and accounts.user_id = auth.uid()
  )
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = recurring_transactions.category_id
        and categories.user_id = auth.uid()
        and categories.type = recurring_transactions.type
    )
  )
);

create policy "Users can read own recurring occurrences"
on public.recurring_transaction_occurrences for select to authenticated
using (auth.uid() = user_id);

create policy "Users can read own financial reminders"
on public.financial_reminders for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own financial reminders"
on public.financial_reminders for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own financial reminders"
on public.financial_reminders for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own financial reminders"
on public.financial_reminders for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.advance_recurring_date(
  p_current_date date,
  p_frequency text,
  p_interval_count integer,
  p_anchor_date date
)
returns date
language plpgsql
immutable
set search_path = public
as $$
declare
  target_month date;
  last_day integer;
  anchor_day integer := extract(day from p_anchor_date);
  anchor_month integer := extract(month from p_anchor_date);
begin
  if p_interval_count is null or p_interval_count < 1 then
    raise exception 'O intervalo da recorrência deve ser maior que zero.';
  end if;

  if p_frequency = 'weekly' then
    return p_current_date + make_interval(days => p_interval_count * 7);
  elsif p_frequency = 'monthly' then
    target_month := (date_trunc('month', p_current_date) + make_interval(months => p_interval_count))::date;
    last_day := extract(day from (target_month + interval '1 month - 1 day'));
    return target_month + (least(anchor_day, last_day) - 1);
  elsif p_frequency = 'yearly' then
    target_month := make_date(
      extract(year from p_current_date)::integer + p_interval_count,
      anchor_month,
      1
    );
    last_day := extract(day from (target_month + interval '1 month - 1 day'));
    return target_month + (least(anchor_day, last_day) - 1);
  end if;

  raise exception 'Frequência de recorrência inválida.';
end;
$$;

create or replace function public.process_due_recurring_transactions(
  p_until_date date default current_date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  recurring_record public.recurring_transactions%rowtype;
  cutoff_date date := least(coalesce(p_until_date, current_date), current_date);
  generated_count integer := 0;
  generated_transaction_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  for recurring_record in
    select *
    from public.recurring_transactions
    where user_id = auth.uid()
      and is_active
      and next_due_date <= cutoff_date
    order by next_due_date, created_at
    for update
  loop
    while recurring_record.next_due_date <= cutoff_date
      and (recurring_record.end_date is null or recurring_record.next_due_date <= recurring_record.end_date)
    loop
      if not exists (
        select 1
        from public.recurring_transaction_occurrences
        where recurring_transaction_id = recurring_record.id
          and due_date = recurring_record.next_due_date
      ) then
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
          recurring_record.account_id,
          recurring_record.category_id,
          recurring_record.title,
          recurring_record.amount,
          recurring_record.type,
          coalesce(recurring_record.payment_method, 'recurring'),
          recurring_record.next_due_date,
          coalesce(nullif(recurring_record.notes, ''), 'Transação recorrente gerada automaticamente.')
        )
        returning id into generated_transaction_id;

        insert into public.recurring_transaction_occurrences (
          user_id,
          recurring_transaction_id,
          transaction_id,
          due_date
        )
        values (
          auth.uid(),
          recurring_record.id,
          generated_transaction_id,
          recurring_record.next_due_date
        );

        generated_count := generated_count + 1;
      end if;

      recurring_record.next_due_date := public.advance_recurring_date(
        recurring_record.next_due_date,
        recurring_record.frequency,
        recurring_record.interval_count,
        recurring_record.start_date
      );
    end loop;

    update public.recurring_transactions
    set next_due_date = recurring_record.next_due_date,
        is_active = case
          when recurring_record.end_date is not null
            and recurring_record.next_due_date > recurring_record.end_date
          then false
          else is_active
        end
    where id = recurring_record.id and user_id = auth.uid();
  end loop;

  return generated_count;
end;
$$;

create or replace function public.reverse_recurring_transaction_occurrence(
  p_occurrence_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  occurrence_record public.recurring_transaction_occurrences%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into occurrence_record
  from public.recurring_transaction_occurrences
  where id = p_occurrence_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Lançamento recorrente não encontrado.';
  end if;

  delete from public.recurring_transaction_occurrences
  where id = occurrence_record.id and user_id = auth.uid();

  delete from public.transactions
  where id = occurrence_record.transaction_id and user_id = auth.uid();
end;
$$;

create or replace function public.delete_recurring_transaction_safely(
  p_recurring_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  perform 1
  from public.recurring_transactions
  where id = p_recurring_transaction_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Recorrência não encontrada.';
  end if;

  if exists (
    select 1 from public.recurring_transaction_occurrences
    where recurring_transaction_id = p_recurring_transaction_id
      and user_id = auth.uid()
  ) then
    raise exception 'Esta recorrência possui lançamentos. Pause-a para preservar o histórico.';
  end if;

  delete from public.recurring_transactions
  where id = p_recurring_transaction_id and user_id = auth.uid();
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
    or exists (select 1 from public.recurring_transaction_occurrences where transaction_id = old.id)
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

revoke all on table public.recurring_transactions from anon, authenticated;
revoke all on table public.recurring_transaction_occurrences from anon, authenticated;
revoke all on table public.financial_reminders from anon, authenticated;

grant select, insert, update on table public.recurring_transactions to authenticated;
grant select on table public.recurring_transaction_occurrences to authenticated;
grant select, insert, update, delete on table public.financial_reminders to authenticated;

revoke all on function public.advance_recurring_date(date, text, integer, date) from public;
revoke all on function public.process_due_recurring_transactions(date) from public;
revoke all on function public.reverse_recurring_transaction_occurrence(uuid) from public;
revoke all on function public.delete_recurring_transaction_safely(uuid) from public;

grant execute on function public.process_due_recurring_transactions(date) to authenticated;
grant execute on function public.reverse_recurring_transaction_occurrence(uuid) to authenticated;
grant execute on function public.delete_recurring_transaction_safely(uuid) to authenticated;
