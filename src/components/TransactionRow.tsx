import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TransactionEntry, Wallet } from "../types";
import { formatCurrency } from "../services/subscriptions";

export function TransactionRow({
  transaction,
  wallet,
  onDelete,
}: {
  transaction: TransactionEntry;
  wallet: Wallet;
  onDelete?: () => void;
}) {
  const isIncoming = transaction.destinationWalletId === wallet.id;
  const isOutgoing = transaction.sourceWalletId === wallet.id;
  const sign = isIncoming && !isOutgoing ? "+" : isOutgoing && !isIncoming ? "-" : "±";
  const counterparty = isIncoming ? transaction.sourceName : transaction.destinationName;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title}>{counterparty}</Text>
        <Text style={styles.note}>{transaction.note || "No description"}</Text>
      </View>
      <View style={styles.right}>
        {onDelete ? (
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Ionicons color="#fb7185" name="trash-outline" size={18} />
          </Pressable>
        ) : null}
        <Text style={[styles.amount, sign === "+" ? styles.income : sign === "-" ? styles.outcome : styles.neutral]}>
          {sign} {formatCurrency(transaction.amount, wallet.currency)}
        </Text>
        <Text style={styles.date}>{formatOccurredAt(transaction.occurredAt ?? `${transaction.date}T00:00:00.000Z`)}</Text>
      </View>
    </View>
  );
}

function formatOccurredAt(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  left: { flex: 1, gap: 4 },
  title: { color: "#f8fbff", fontSize: 15, fontWeight: "700" },
  note: { color: "#90a4cf", fontSize: 13 },
  right: { alignItems: "flex-end", gap: 4 },
  deleteButton: {
    padding: 4,
  },
  amount: { fontSize: 15, fontWeight: "800" },
  income: { color: "#5eead4" },
  outcome: { color: "#fb7185" },
  neutral: { color: "#8db8ff" },
  date: { color: "#90a4cf", fontSize: 12 },
});
