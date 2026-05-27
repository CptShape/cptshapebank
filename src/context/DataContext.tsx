import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { db } from "../services/firebase";
import { makeId } from "../services/ids";
import {
  addDays,
  addInterval,
  compareDateOnly,
  formatCurrency,
  isDue,
  monthRange,
  normalizeDateOnly,
  parseDateOnly,
  todayIso,
} from "../services/subscriptions";
import { SubscriptionEvent, SubscriptionPlan, TotalsByCurrency, TransactionEntry, Wallet } from "../types";
import { addAmount, computeIncomeAndSpend } from "../services/summary";

type WalletInput = {
  name: string;
  currency: string;
  icon: string;
  balance: number;
  isCreditCard: boolean;
};

type TransactionInput = {
  sourceType: "income" | "wallet";
  destinationType: "outcome" | "wallet";
  sourceWalletId?: string;
  destinationWalletId?: string;
  amount: number;
  date: string;
  occurredAt: string;
  note: string;
};

type SubscriptionInput = {
  name: string;
  price: number;
  walletId: string;
  interval: SubscriptionPlan["interval"];
  nextRenewalDate: string;
};

type PendingEventView = SubscriptionEvent & {
  formattedPrice: string;
};

type DataContextValue = {
  wallets: Wallet[];
  transactions: TransactionEntry[];
  subscriptions: SubscriptionPlan[];
  pendingEvents: PendingEventView[];
  loading: boolean;
  addWallet: (input: WalletInput) => Promise<void>;
  updateWallet: (walletId: string, patch: Partial<WalletInput>) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
  createTransaction: (input: TransactionInput) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addSubscription: (input: SubscriptionInput) => Promise<void>;
  updateSubscription: (subscriptionId: string, patch: Partial<SubscriptionInput & { active: boolean }>) => Promise<void>;
  resolveSubscriptionEvent: (eventId: string, accepted: boolean) => Promise<void>;
  totalsByCurrency: TotalsByCurrency;
  incomeTotals: TotalsByCurrency;
  spendTotals: TotalsByCurrency;
  monthSubscriptionNeed: TotalsByCurrency;
  next30DaySubscriptionNeedByWallet: Record<string, number>;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

function sortWallets(items: Wallet[]) {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function sortTransactions(items: TransactionEntry[]) {
  return [...items].sort((left, right) => {
    const leftValue = left.occurredAt ?? `${normalizeDateOnly(left.date)}T00:00:00.000Z`;
    const rightValue = right.occurredAt ?? `${normalizeDateOnly(right.date)}T00:00:00.000Z`;
    return rightValue.localeCompare(leftValue);
  });
}

function sanitizePatch<T extends Record<string, unknown>>(value: T): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Record<string, string | number | boolean | null>;
}

function hydrateWallet(id: string, raw: Omit<Wallet, "id">) {
  return {
    id,
    ...raw,
    isCreditCard: raw.isCreditCard ?? false,
  } satisfies Wallet;
}

function userPaths(uid: string) {
  return {
    wallets: collection(db, "users", uid, "wallets"),
    transactions: collection(db, "users", uid, "transactions"),
    subscriptions: collection(db, "users", uid, "subscriptions"),
    subscriptionEvents: collection(db, "users", uid, "subscriptionEvents"),
  };
}

export function DataProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    const paths = userPaths(user.uid);
    const unsubWallets = onSnapshot(query(paths.wallets, orderBy("name")), (snapshot) => {
      setWallets(sortWallets(snapshot.docs.map((item) => hydrateWallet(item.id, item.data() as Omit<Wallet, "id">))));
      setLoading(false);
    });
    const unsubTransactions = onSnapshot(paths.transactions, (snapshot) => {
      setTransactions(
        sortTransactions(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<TransactionEntry, "id">) }))),
      );
    });
    const unsubSubscriptions = onSnapshot(query(paths.subscriptions, orderBy("name")), (snapshot) => {
      setSubscriptions(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<SubscriptionPlan, "id">) })));
    });
    const unsubEvents = onSnapshot(query(paths.subscriptionEvents, orderBy("dueDate", "asc")), (snapshot) => {
      setEvents(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<SubscriptionEvent, "id">) })));
    });

    return () => {
      unsubWallets();
      unsubTransactions();
      unsubSubscriptions();
      unsubEvents();
    };
  }, [user]);

  useEffect(() => {
    if (!user || subscriptions.length === 0 || wallets.length === 0) {
      return;
    }
    void syncDueSubscriptionEvents(user.uid, subscriptions, events, wallets);
  }, [events, subscriptions, user, wallets]);

  const walletMap = useMemo(() => Object.fromEntries(wallets.map((wallet) => [wallet.id, wallet])), [wallets]);
  const walletCurrencyById = useMemo(
    () => Object.fromEntries(wallets.map((wallet) => [wallet.id, wallet.currency])),
    [wallets],
  );

  const totalsByCurrency = useMemo(() => {
    return wallets.reduce<TotalsByCurrency>((acc, wallet) => addAmount(acc, wallet.currency, wallet.balance), {});
  }, [wallets]);

  const { incomeTotals, spendTotals } = useMemo(
    () => computeIncomeAndSpend(transactions, walletCurrencyById),
    [transactions, walletCurrencyById],
  );

  const monthSubscriptionNeed = useMemo(() => projectSubscriptionNeedForMonth(subscriptions), [subscriptions]);

  const pendingEvents = useMemo<PendingEventView[]>(
    () =>
      events
        .filter((event) => event.status === "pending")
        .map((event) => ({
          ...event,
          formattedPrice: formatCurrency(event.price, event.currency),
        })),
    [events],
  );

  const next30DaySubscriptionNeedByWallet = useMemo(() => {
    const cutoff = addDays(todayIso(), 30);
    const today = parseDateOnly(todayIso()).getTime();
    const cutoffTime = parseDateOnly(cutoff).getTime();
    return subscriptions.reduce<Record<string, number>>((acc, subscription) => {
      if (!subscription.active) {
        return acc;
      }
      let cursor = normalizeDateOnly(subscription.nextRenewalDate);
      while (parseDateOnly(cursor).getTime() <= cutoffTime) {
        if (parseDateOnly(cursor).getTime() >= today) {
          acc[subscription.walletId] = (acc[subscription.walletId] ?? 0) + subscription.price;
        }
        cursor = addInterval(cursor, subscription.interval);
      }
      return acc;
    }, {});
  }, [subscriptions]);

  async function createTransactionInternal(input: TransactionInput) {
    if (!user) {
      throw new Error("You must be signed in.");
    }
    if (input.sourceType !== "wallet" && input.destinationType !== "wallet") {
      throw new Error("At least one side of the transaction must be a wallet.");
    }
    if (input.sourceWalletId && input.destinationWalletId && input.sourceWalletId === input.destinationWalletId) {
      throw new Error("Source and destination wallets cannot be the same.");
    }

    const txId = makeId("txn");
    await runTransaction(db, async (transaction) => {
      const sourceRef = input.sourceWalletId ? doc(db, "users", user.uid, "wallets", input.sourceWalletId) : null;
      const destinationRef = input.destinationWalletId
        ? doc(db, "users", user.uid, "wallets", input.destinationWalletId)
        : null;
      const sourceSnap = sourceRef ? await transaction.get(sourceRef) : null;
      const destinationSnap = destinationRef ? await transaction.get(destinationRef) : null;
      const sourceWallet = sourceSnap?.data() as Wallet | undefined;
      const destinationWallet = destinationSnap?.data() as Wallet | undefined;

      if (sourceWallet && destinationWallet && sourceWallet.currency !== destinationWallet.currency) {
        throw new Error("Wallet-to-wallet transfers currently require the same currency.");
      }

      if (input.sourceType === "wallet") {
        if (!sourceWallet) {
          throw new Error("Source wallet does not exist.");
        }
        if (!sourceWallet.isCreditCard && sourceWallet.balance < input.amount) {
          throw new Error("Source wallet does not have enough balance.");
        }
        transaction.update(sourceRef!, {
          balance: sourceWallet.balance - input.amount,
          updatedAt: new Date().toISOString(),
        });
      }

      if (input.destinationType === "wallet") {
        if (!destinationWallet) {
          throw new Error("Destination wallet does not exist.");
        }
        transaction.update(destinationRef!, {
          balance: destinationWallet.balance + input.amount,
          updatedAt: new Date().toISOString(),
        });
      }

      transaction.set(doc(db, "users", user.uid, "transactions", txId), {
        amount: input.amount,
        date: normalizeDateOnly(input.date),
        occurredAt: input.occurredAt,
        note: input.note.trim(),
        sourceType: input.sourceType,
        destinationType: input.destinationType,
        sourceWalletId: input.sourceWalletId ?? null,
        destinationWalletId: input.destinationWalletId ?? null,
        sourceName: input.sourceType === "income" ? "Income" : sourceWallet?.name ?? "Unknown wallet",
        destinationName:
          input.destinationType === "outcome" ? "Outcome" : destinationWallet?.name ?? "Unknown wallet",
        createdAt: serverTimestamp(),
      });
    });
  }

  const value = useMemo<DataContextValue>(() => {
    if (!user) {
      throw new Error("DataProvider requires an authenticated user");
    }

    return {
      wallets,
      transactions,
      subscriptions: subscriptions.map((subscription) => ({
        ...subscription,
        walletName: walletMap[subscription.walletId]?.name ?? "Unknown wallet",
      })),
      pendingEvents,
      loading,
      totalsByCurrency,
      incomeTotals,
      spendTotals,
      monthSubscriptionNeed,
      next30DaySubscriptionNeedByWallet,
      addWallet: async (input) => {
        const id = makeId("wallet");
        const now = new Date().toISOString();
        const nextWallet: Wallet = {
          id,
          ...input,
          createdAt: now,
          updatedAt: now,
        };
        setWallets((current) => sortWallets([...current, nextWallet]));
        await setDoc(doc(db, "users", user.uid, "wallets", id), {
          ...nextWallet,
        });
      },
      updateWallet: async (walletId, patch) => {
        setWallets((current) =>
          sortWallets(
            current.map((wallet) =>
              wallet.id === walletId ? { ...wallet, ...patch, updatedAt: new Date().toISOString() } : wallet,
            ),
          ),
        );
        await updateDoc(doc(db, "users", user.uid, "wallets", walletId), sanitizePatch({
          ...patch,
          updatedAt: new Date().toISOString(),
        }));
      },
      deleteWallet: async (walletId) => {
        const isUsed = transactions.some(
          (tx) => tx.sourceWalletId === walletId || tx.destinationWalletId === walletId,
        ) || subscriptions.some((subscription) => subscription.walletId === walletId);

        if (isUsed) {
          throw new Error("This wallet is linked to existing activity. Reassign or remove those items first.");
        }

        setWallets((current) => current.filter((wallet) => wallet.id !== walletId));
        await deleteDoc(doc(db, "users", user.uid, "wallets", walletId));
      },
      createTransaction: createTransactionInternal,
      deleteTransaction: async (transactionId) => {
        setTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
        await deleteDoc(doc(db, "users", user.uid, "transactions", transactionId));
      },
      addSubscription: async (input) => {
        const wallet = walletMap[input.walletId];
        if (!wallet) {
          throw new Error("Please choose a wallet for this subscription.");
        }
        const id = makeId("sub");
        await setDoc(doc(db, "users", user.uid, "subscriptions", id), {
          ...input,
          nextRenewalDate: normalizeDateOnly(input.nextRenewalDate),
          walletName: wallet.name,
          currency: wallet.currency,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      },
      updateSubscription: async (subscriptionId, patch) => {
        const nextPatch: Partial<SubscriptionPlan> & { updatedAt: string; walletName?: string } = {
          ...patch,
          nextRenewalDate: patch.nextRenewalDate ? normalizeDateOnly(patch.nextRenewalDate) : undefined,
          updatedAt: new Date().toISOString(),
        };
        if (patch.walletId) {
          const wallet = walletMap[patch.walletId];
          nextPatch.walletName = wallet?.name ?? "Unknown wallet";
          nextPatch.currency = wallet?.currency ?? "";
        }
        await updateDoc(doc(db, "users", user.uid, "subscriptions", subscriptionId), sanitizePatch(nextPatch));
      },
      resolveSubscriptionEvent: async (eventId, accepted) => {
        const event = events.find((item) => item.id === eventId);
        if (!event) {
          throw new Error("Subscription event could not be found.");
        }
        const subscription = subscriptions.find((item) => item.id === event.subscriptionId);
        if (!subscription) {
          throw new Error("Linked subscription could not be found.");
        }

        if (accepted) {
          await createTransactionInternal({
            sourceType: "wallet",
            sourceWalletId: event.walletId,
            destinationType: "outcome",
            amount: event.price,
            date: normalizeDateOnly(event.dueDate),
            occurredAt: `${normalizeDateOnly(event.dueDate)}T09:00:00.000Z`,
            note: `${event.name} subscription renewal`,
          });
        }

        await updateDoc(doc(db, "users", user.uid, "subscriptionEvents", eventId), {
          status: accepted ? "accepted" : "dismissed",
          resolvedAt: new Date().toISOString(),
        });
        await updateDoc(doc(db, "users", user.uid, "subscriptions", event.subscriptionId), {
          active: accepted,
          nextRenewalDate: accepted
            ? addInterval(subscription.nextRenewalDate, subscription.interval)
            : subscription.nextRenewalDate,
          updatedAt: new Date().toISOString(),
        });
      },
    };
  }, [
    events,
    incomeTotals,
    loading,
    monthSubscriptionNeed,
    next30DaySubscriptionNeedByWallet,
    pendingEvents,
    spendTotals,
    subscriptions,
    totalsByCurrency,
    transactions,
    user,
    walletMap,
    wallets,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

async function syncDueSubscriptionEvents(
  uid: string,
  subscriptions: SubscriptionPlan[],
  events: SubscriptionEvent[],
  wallets: Wallet[],
) {
  const walletMap = Object.fromEntries(wallets.map((wallet) => [wallet.id, wallet]));
  const pendingBySubscription = new Set(
    events.filter((event) => event.status === "pending").map((event) => `${event.subscriptionId}:${event.dueDate}`),
  );

  for (const subscription of subscriptions) {
    if (!subscription.active || !isDue(subscription.nextRenewalDate)) {
      continue;
    }
    const key = `${subscription.id}:${subscription.nextRenewalDate}`;
    if (pendingBySubscription.has(key)) {
      continue;
    }

    const wallet = walletMap[subscription.walletId];
    if (!wallet) {
      continue;
    }

    const eventId = makeId("subevt");
    await setDoc(doc(db, "users", uid, "subscriptionEvents", eventId), {
      subscriptionId: subscription.id,
      name: subscription.name,
      walletId: subscription.walletId,
      walletName: wallet.name,
      currency: subscription.currency,
      price: subscription.price,
      dueDate: normalizeDateOnly(subscription.nextRenewalDate),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }
}

export function projectSubscriptionNeedForMonth(subscriptions: SubscriptionPlan[]) {
  const { start, end } = monthRange();
  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  return subscriptions.reduce<TotalsByCurrency>((acc, subscription) => {
    if (!subscription.active) {
      return acc;
    }
    let cursor = normalizeDateOnly(subscription.nextRenewalDate);
    while (parseDateOnly(cursor).getTime() <= endDate.getTime()) {
      if (parseDateOnly(cursor).getTime() >= startDate.getTime()) {
        acc = addAmount(acc, subscription.currency, subscription.price);
      }
      cursor = addInterval(cursor, subscription.interval);
    }
    return acc;
  }, {});
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used inside DataProvider");
  }
  return context;
}
