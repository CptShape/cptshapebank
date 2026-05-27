import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useData } from "../context/DataContext";
import { AmountList } from "../components/AmountList";
import { InfoCard } from "../components/InfoCard";
import { ScreenLayout } from "../components/ScreenLayout";
import { SectionCard } from "../components/SectionCard";
import { addAmount } from "../services/summary";
import { monthRange } from "../services/subscriptions";

export function SummaryScreen() {
  const { next30DaySubscriptionNeedByWallet, subscriptions, transactions, wallets } = useData();

  const debtTotals = useMemo(() => {
    return wallets.reduce<Record<string, number>>((acc, wallet) => {
      if (wallet.isCreditCard && wallet.balance < 0) {
        acc = addAmount(acc, wallet.currency, Math.abs(wallet.balance));
      }
      return acc;
    }, {});
  }, [wallets]);

  const safeToSpendTotals = useMemo(() => {
    return wallets.reduce<Record<string, number>>((acc, wallet) => {
      const upcoming = next30DaySubscriptionNeedByWallet[wallet.id] ?? 0;
      acc = addAmount(acc, wallet.currency, wallet.balance - upcoming);
      return acc;
    }, {});
  }, [next30DaySubscriptionNeedByWallet, wallets]);

  const thisMonthFlow = useMemo(() => {
    const range = monthRange();
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.date < range.start || transaction.date > range.end) {
          return acc;
        }
        if (transaction.sourceType === "income" && transaction.destinationWalletId) {
          const currency = wallets.find((wallet) => wallet.id === transaction.destinationWalletId)?.currency;
          if (currency) {
            acc.income = addAmount(acc.income, currency, transaction.amount);
          }
        }
        if (transaction.destinationType === "outcome" && transaction.sourceWalletId) {
          const currency = wallets.find((wallet) => wallet.id === transaction.sourceWalletId)?.currency;
          if (currency) {
            acc.spending = addAmount(acc.spending, currency, transaction.amount);
          }
        }
        return acc;
      },
      { income: {}, spending: {} } as { income: Record<string, number>; spending: Record<string, number> },
    );
  }, [transactions, wallets]);

  const mostPressuredWallet = useMemo(() => {
    return wallets
      .map((wallet) => ({
        wallet,
        needed: next30DaySubscriptionNeedByWallet[wallet.id] ?? 0,
      }))
      .filter((item) => item.needed > 0)
      .sort((left, right) => right.needed - left.needed)[0];
  }, [next30DaySubscriptionNeedByWallet, wallets]);

  return (
    <ScreenLayout
      subtitle="A higher-level view of runway, debt pressure, and where the next wave of recurring payments will hit."
      title="Summary"
    >
      <View style={styles.grid}>
        <InfoCard
          title="Active Subscriptions"
          tone="teal"
          value={`${subscriptions.filter((subscription) => subscription.active).length} live renewals`}
        />
        <InfoCard
          title="Most Pressured Wallet"
          tone="blue"
          value={
            mostPressuredWallet
              ? `${mostPressuredWallet.wallet.name} needs ${new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: mostPressuredWallet.wallet.currency,
                  maximumFractionDigits: 2,
                }).format(mostPressuredWallet.needed)} soon`
              : "No subscriptions due in 30 days"
          }
        />
        <InfoCard
          title="Credit Card Debt"
          tone="orange"
          value={Object.keys(debtTotals).length === 0 ? "No card debt tracked" : "Balances below zero are grouped below"}
        />
      </View>

      <SectionCard title="Safe To Spend After 30-Day Subscriptions">
        <AmountList emptyLabel="No wallets yet." totals={safeToSpendTotals} />
      </SectionCard>
      <SectionCard title="This Month's Money In">
        <AmountList emptyLabel="No income recorded this month." totals={thisMonthFlow.income} />
      </SectionCard>
      <SectionCard title="This Month's Money Out">
        <AmountList emptyLabel="No spending recorded this month." totals={thisMonthFlow.spending} />
      </SectionCard>
      <SectionCard title="Credit Card Debt Totals">
        <AmountList emptyLabel="No credit card debt right now." totals={debtTotals} />
      </SectionCard>
      <SectionCard title="Upcoming 30-Day Subscription Pressure By Wallet">
        {wallets.length === 0 ? (
          <Text style={styles.empty}>No wallets yet.</Text>
        ) : (
          wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletPressureRow}>
              <View style={styles.walletPressureText}>
                <Text style={styles.walletPressureName}>{wallet.name}</Text>
                <Text style={styles.walletPressureMeta}>{wallet.currency} {wallet.isCreditCard ? "credit card" : "wallet"}</Text>
              </View>
              <Text style={styles.walletPressureValue}>
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: wallet.currency,
                  maximumFractionDigits: 2,
                }).format(next30DaySubscriptionNeedByWallet[wallet.id] ?? 0)}
              </Text>
            </View>
          ))
        )}
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  empty: { color: "#90a4cf", fontSize: 14 },
  walletPressureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  walletPressureText: { flex: 1, gap: 4 },
  walletPressureName: { color: "#f8fbff", fontSize: 15, fontWeight: "700" },
  walletPressureMeta: { color: "#90a4cf", fontSize: 12 },
  walletPressureValue: { color: "#5eead4", fontSize: 15, fontWeight: "800" },
});
