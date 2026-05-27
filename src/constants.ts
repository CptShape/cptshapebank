import { FormOption } from "./types";

export const walletIcons = ["🏦", "💵", "💳", "🪙", "👜", "📈", "💎", "🏡"];

export const currencyOptions: FormOption[] = [
  { label: "Turkish Lira (TRY)", value: "TRY" },
  { label: "US Dollar (USD)", value: "USD" },
  { label: "Euro (EUR)", value: "EUR" },
  { label: "British Pound (GBP)", value: "GBP" },
];

export const subscriptionIntervals: FormOption[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Every 3 Months", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];
