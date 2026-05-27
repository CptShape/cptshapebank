export type Wallet = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  icon: string;
  isCreditCard: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TransactionEntry = {
  id: string;
  amount: number;
  date: string;
  occurredAt?: string;
  note: string;
  sourceType: "income" | "wallet";
  destinationType: "outcome" | "wallet";
  sourceWalletId?: string;
  destinationWalletId?: string;
  sourceName: string;
  destinationName: string;
  createdAt?: string;
};

export type SubscriptionInterval = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  walletId: string;
  walletName?: string;
  currency: string;
  nextRenewalDate: string;
  interval: SubscriptionInterval;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SubscriptionEvent = {
  id: string;
  subscriptionId: string;
  name: string;
  walletId: string;
  walletName: string;
  currency: string;
  price: number;
  dueDate: string;
  status: "pending" | "accepted" | "dismissed";
  createdAt?: string;
  resolvedAt?: string;
};

export type TotalsByCurrency = Record<string, number>;

export type FormOption = {
  label: string;
  value: string;
};
