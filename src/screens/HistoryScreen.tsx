import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { confirmDestructive, showMessage } from "../services/feedback";
import { useData } from "../context/DataContext";
import { AmountList } from "../components/AmountList";
import { InfoCard } from "../components/InfoCard";
import { FormOption } from "../types";
import { ScreenLayout } from "../components/ScreenLayout";
import { SectionCard } from "../components/SectionCard";
import { OptionSelector } from "../components/OptionSelector";
import { TransactionRow } from "../components/TransactionRow";
import { compareDateOnly, datePartFromIso, lastMonthRange, monthRange } from "../services/subscriptions";

const rangeOptions: FormOption[] = [
  { label: "This Month", value: "this-month" },
  { label: "Last Month", value: "last-month" },
  { label: "Last 3 Months", value: "last-3-months" },
  { label: "Last 6 Months", value: "last-6-months" },
  { label: "This Year", value: "this-year" },
  { label: "All Time", value: "all-time" },
];

export function HistoryScreen() {
  const { deleteTransaction, transactions, wallets } = useData();
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [range, setRange] = useState("this-month");

  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) ?? wallets[0];
  const walletOptions = useMemo(
    () => wallets.map((wallet) => ({ label: wallet.name, value: wallet.id })),
    [wallets],
  );
  const activeRange = useMemo(() => resolveRange(range), [range]);
  const filtered = useMemo(() => {
    if (!selectedWallet) {
      return [];
    }
    return transactions.filter((transaction) => {
      const touchesWallet =
        transaction.sourceWalletId === selectedWallet.id || transaction.destinationWalletId === selectedWallet.id;
      const transactionDate = datePartFromIso(transaction.occurredAt ?? `${transaction.date}T00:00:00.000Z`);
      const inRange =
        (activeRange.start === null || compareDateOnly(transactionDate, activeRange.start) >= 0) &&
        (activeRange.end === null || compareDateOnly(transactionDate, activeRange.end) <= 0);
      return touchesWallet && inRange;
    });
  }, [activeRange.end, activeRange.start, selectedWallet, transactions]);

  const rangeTotals = useMemo(() => {
    if (!selectedWallet) {
      return {
        received: 0,
        spent: 0,
        change: 0,
      };
    }
    return filtered.reduce(
      (acc, transaction) => {
        const incoming = transaction.destinationWalletId === selectedWallet.id && transaction.sourceWalletId !== selectedWallet.id;
        const outgoing = transaction.sourceWalletId === selectedWallet.id && transaction.destinationWalletId !== selectedWallet.id;
        if (incoming) {
          acc.received += transaction.amount;
          acc.change += transaction.amount;
        }
        if (outgoing) {
          acc.spent += transaction.amount;
          acc.change -= transaction.amount;
        }
        return acc;
      },
      { received: 0, spent: 0, change: 0 },
    );
  }, [filtered, selectedWallet]);

  return (
    <ScreenLayout
      subtitle="Pick a wallet to review every incoming, outgoing, and transfer entry linked to it."
      title="History"
    >
      <SectionCard title="Wallet History">
        {wallets.length === 0 ? (
          <Text style={styles.empty}>Create at least one wallet before reviewing history.</Text>
        ) : (
          <>
            <View style={styles.grid}>
              <View style={styles.metricCard}>
                <InfoCard title="Net Change" tone="teal" value={formatSigned(selectedWallet.currency, rangeTotals.change)} />
              </View>
              <View style={styles.metricCard}>
                <InfoCard title="Total Received" tone="blue" value={formatPlain(selectedWallet.currency, rangeTotals.received)} />
              </View>
              <View style={styles.metricCard}>
                <InfoCard title="Total Spent" tone="orange" value={formatPlain(selectedWallet.currency, rangeTotals.spent)} />
              </View>
            </View>
            <OptionSelector
              label="Wallet"
              onChange={setSelectedWalletId}
              options={walletOptions}
              value={selectedWallet?.id ?? walletOptions[0]?.value ?? ""}
            />
            <OptionSelector label="Range" onChange={setRange} options={rangeOptions} value={range} />
            {filtered.length === 0 ? (
              <Text style={styles.empty}>No transactions found for this wallet yet.</Text>
            ) : (
              filtered.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  onDelete={() => {
                    void confirmDestructive(
                      "Delete transaction",
                      "This removes the history entry and affects summaries, but it will not refund the wallet balance.",
                    ).then((confirmed) => {
                      if (!confirmed) {
                        return;
                      }
                      void deleteTransaction(transaction.id).catch((error) => {
                        showMessage("Could not delete transaction", error.message);
                      });
                    });
                  }}
                  transaction={transaction}
                  wallet={selectedWallet!}
                />
              ))
            )}
          </>
        )}
      </SectionCard>
    </ScreenLayout>
  );
}

function resolveRange(range: string) {
  const now = new Date();
  if (range === "this-month") {
    return monthRange(now);
  }
  if (range === "last-month") {
    return lastMonthRange(now);
  }
  if (range === "last-3-months") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    };
  }
  if (range === "last-6-months") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    };
  }
  if (range === "this-year") {
    return {
      start: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
      end: new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10),
    };
  }
  return { start: null, end: null };
}

function formatPlain(currency: string, amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

function formatSigned(currency: string, amount: number) {
  const base = formatPlain(currency, Math.abs(amount));
  return amount > 0 ? `+ ${base}` : amount < 0 ? `- ${base}` : base;
}

const styles = StyleSheet.create({
  empty: { color: "#90a4cf", fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: { flexBasis: 180, flexGrow: 1, minWidth: 0 },
});
