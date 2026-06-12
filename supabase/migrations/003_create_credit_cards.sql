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

create index if not exists credit_cards_user_id_idx on public.credit_cards(user_id);
create index if not exists credit_card_purchases_user_id_idx on public.credit_card_purchases(user_id);
create index if not exists credit_card_purchases_card_id_idx on public.credit_card_purchases(card_id);
create index if not exists credit_card_installments_user_id_idx on public.credit_card_installments(user_id);
create index if not exists credit_card_installments_card_month_idx on public.credit_card_installments(card_id, competence_month);
create index if not exists credit_card_invoice_payments_user_id_idx on public.credit_card_invoice_payments(user_id);
create index if not exists credit_card_invoice_payments_card_month_idx on public.credit_card_invoice_payments(card_id, invoice_month);

alter table public.credit_cards enable row level security;
alter table public.credit_card_purchases enable row level security;
alter table public.credit_card_installments enable row level security;
alter table public.credit_card_invoice_payments enable row level security;

drop trigger if exists set_credit_cards_updated_at on public.credit_cards;
create trigger set_credit_cards_updated_at
before update on public.credit_cards
for each row
execute function public.set_updated_at();

drop trigger if exists set_credit_card_purchases_updated_at on public.credit_card_purchases;
create trigger set_credit_card_purchases_updated_at
before update on public.credit_card_purchases
for each row
execute function public.set_updated_at();

drop trigger if exists set_credit_card_installments_updated_at on public.credit_card_installments;
create trigger set_credit_card_installments_updated_at
before update on public.credit_card_installments
for each row
execute function public.set_updated_at();

drop policy if exists "Users can read own credit cards" on public.credit_cards;
drop policy if exists "Users can insert own credit cards" on public.credit_cards;
drop policy if exists "Users can update own credit cards" on public.credit_cards;
drop policy if exists "Users can delete own credit cards" on public.credit_cards;

create policy "Users can read own credit cards"
on public.credit_cards for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own credit cards"
on public.credit_cards for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own credit cards"
on public.credit_cards for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own credit cards"
on public.credit_cards for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own credit purchases" on public.credit_card_purchases;
drop policy if exists "Users can insert own credit purchases" on public.credit_card_purchases;
drop policy if exists "Users can update own credit purchases" on public.credit_card_purchases;
drop policy if exists "Users can delete own credit purchases" on public.credit_card_purchases;

create policy "Users can read own credit purchases"
on public.credit_card_purchases for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own credit purchases"
on public.credit_card_purchases for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.credit_cards
    where credit_cards.id = credit_card_purchases.card_id
    and credit_cards.user_id = auth.uid()
  )
  and (
    category_id is null
    or exists (
      select 1 from public.categories
      where categories.id = credit_card_purchases.category_id
      and categories.user_id = auth.uid()
    )
  )
);

create policy "Users can update own credit purchases"
on public.credit_card_purchases for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own credit purchases"
on public.credit_card_purchases for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own credit installments" on public.credit_card_installments;
drop policy if exists "Users can insert own credit installments" on public.credit_card_installments;
drop policy if exists "Users can update own credit installments" on public.credit_card_installments;
drop policy if exists "Users can delete own credit installments" on public.credit_card_installments;

create policy "Users can read own credit installments"
on public.credit_card_installments for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own credit installments"
on public.credit_card_installments for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.credit_card_purchases
    where credit_card_purchases.id = credit_card_installments.purchase_id
    and credit_card_purchases.user_id = auth.uid()
  )
);

create policy "Users can update own credit installments"
on public.credit_card_installments for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own credit installments"
on public.credit_card_installments for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own invoice payments" on public.credit_card_invoice_payments;
drop policy if exists "Users can insert own invoice payments" on public.credit_card_invoice_payments;
drop policy if exists "Users can delete own invoice payments" on public.credit_card_invoice_payments;

create policy "Users can read own invoice payments"
on public.credit_card_invoice_payments for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own invoice payments"
on public.credit_card_invoice_payments for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.credit_cards
    where credit_cards.id = credit_card_invoice_payments.card_id
    and credit_cards.user_id = auth.uid()
  )
  and exists (
    select 1 from public.accounts
    where accounts.id = credit_card_invoice_payments.account_id
    and accounts.user_id = auth.uid()
  )
);

create policy "Users can delete own invoice payments"
on public.credit_card_invoice_payments for delete to authenticated
using (auth.uid() = user_id);
