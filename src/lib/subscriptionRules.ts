import { addMonths, getInvoiceDueDate, getTodayValue } from "./dates";

type SubscriptionSchedule = {
  billing_day: number;
  recurrence: "monthly" | "quarterly" | "yearly";
};

export function getNextSubscriptionChargeDate(
  subscription: SubscriptionSchedule,
  lastChargeDate?: string,
  today = getTodayValue(),
) {
  const currentMonth = today.slice(0, 7);
  const step =
    subscription.recurrence === "yearly"
      ? 12
      : subscription.recurrence === "quarterly"
        ? 3
        : 1;

  if (lastChargeDate) {
    return getInvoiceDueDate(
      addMonths(lastChargeDate.slice(0, 7), step),
      subscription.billing_day,
    );
  }

  const currentChargeDate = getInvoiceDueDate(
    currentMonth,
    subscription.billing_day,
  );
  return currentChargeDate < today
    ? getInvoiceDueDate(addMonths(currentMonth, step), subscription.billing_day)
    : currentChargeDate;
}
