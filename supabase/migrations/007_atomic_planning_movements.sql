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
