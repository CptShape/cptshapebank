import { TotalsByCurrency, TransactionEntry } from "../types";

export function addAmount(totals: TotalsByCurrency, currency: string, amount: number) {
  return {
    ...totals,
    [currency]: (totals[currency] ?? 0) + amount,
  };
}

export function computeIncomeAndSpend(
  transactions: TransactionEntry[],
  walletCurrencyById: Record<string, string>,
) {
  let incomeTotals: TotalsByCurrency = {};
  let spendTotals: TotalsByCurrency = {};

  for (const tx of transactions) {
    if (tx.sourceType === "income" && tx.destinationWalletId) {
      const currency = walletCurrencyById[tx.destinationWalletId];
      if (currency) {
        incomeTotals = addAmount(incomeTotals, currency, tx.amount);
      }
    }
    if (tx.destinationType === "outcome" && tx.sourceWalletId) {
      const currency = walletCurrencyById[tx.sourceWalletId];
      if (currency) {
        spendTotals = addAmount(spendTotals, currency, tx.amount);
      }
    }
  }

  return { incomeTotals, spendTotals };
}
