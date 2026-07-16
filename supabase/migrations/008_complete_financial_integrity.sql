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

  select purchase, card.closing_day
  into purchase_record, card_closing_day
  from public.credit_card_purchases purchase
  join public.credit_cards card on card.id = purchase.card_id
  where purchase.id = p_purchase_id
    and purchase.user_id = auth.uid()
    and card.user_id = auth.uid()
  for update of purchase;

  if not found then
    raise exception 'Compra não encontrada.';
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
