# Invariantes financeiras

Este documento define as regras que devem permanecer verdadeiras em qualquer
alteração do Gestor de Gastos.

## Fonte de verdade

- O saldo atual de uma conta é o saldo inicial mais receitas menos despesas das
  transações vinculadas com data até hoje. Lançamentos futuros permanecem no
  calendário, mas ainda não alteram o saldo disponível.
- O valor atual de uma meta é o valor persistido em `goals.current_amount` e
  deve acompanhar exatamente seus movimentos confirmados.
- O saldo de uma dívida é `debts.remaining_balance` e nunca pode ser negativo.
- Compras no cartão afetam limite e fatura. A conta bancária só é afetada quando
  a fatura é paga e a transação de pagamento é criada.

## Operações compostas

- Um aporte em meta reduz a conta escolhida e aumenta a meta pelo mesmo valor.
- Uma retirada de meta aumenta a conta escolhida e reduz a meta pelo mesmo
  valor; nunca pode exceder o valor atual da meta.
- Um pagamento de dívida reduz a conta e o saldo da dívida pelo mesmo valor; o
  valor efetivo nunca excede o saldo restante.
- Transação, movimento/pagamento e atualização de saldo devem ocorrer na mesma
  transação de banco. Falha em qualquer etapa desfaz todas as etapas.
- Compras e suas parcelas são criadas ou recalculadas juntas, preservando a soma
  exata do valor total, inclusive quando há diferença de centavos.
- Pagamentos de fatura e cobranças de assinatura só podem ser desfeitos no módulo
  de origem; a reversão remove também a transação que afetou a conta.

## Integridade

- Valores financeiros de movimentação devem ser maiores que zero.
- Registros só podem referenciar contas, metas e dívidas do usuário autenticado.
- Edição e exclusão não podem deixar registros financeiros vinculados em estado
  parcial ou recalcular o saldo por caminhos diferentes.
- Transações geradas por meta, dívida, fatura ou assinatura não podem ser
  editadas ou apagadas diretamente na tela geral de transações.
- Valores monetários são armazenados como `numeric` no Supabase e convertidos
  explicitamente para número apenas na camada de apresentação/cálculo.
