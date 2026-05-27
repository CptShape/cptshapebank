import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Wallet } from "../types";
import { formatCurrency } from "../services/subscriptions";

export function WalletCard({
  wallet,
  next30DaySubscriptionNeed,
  onEdit,
  onDelete,
}: {
  wallet: Wallet;
  next30DaySubscriptionNeed: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{wallet.icon}</Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.name}>{wallet.name}</Text>
          <Text style={styles.currency}>{wallet.currency} {wallet.isCreditCard ? "credit card" : "wallet"}</Text>
        </View>
      </View>
      <Text style={[styles.balance, wallet.balance < 0 && styles.balanceNegative]}>
        {formatCurrency(wallet.balance, wallet.currency)}
      </Text>
      <Text style={styles.subscriptionNeed}>
        Next 30-day subscription need: {formatCurrency(next30DaySubscriptionNeed, wallet.currency)}
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onEdit} style={styles.action}>
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.action, styles.deleteAction]}>
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(8, 14, 30, 0.96)",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(94,234,212,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 26 },
  textWrap: { flex: 1, gap: 4 },
  name: { color: "#f8fbff", fontSize: 18, fontWeight: "800" },
  currency: { color: "#9fb1db", fontSize: 14 },
  balance: { color: "#5eead4", fontSize: 24, fontWeight: "800" },
  balanceNegative: { color: "#fb7185" },
  subscriptionNeed: { color: "#9fb1db", fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: "row", gap: 10 },
  action: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: "#182546",
    alignItems: "center",
  },
  deleteAction: { backgroundColor: "#382135" },
  actionText: { color: "#dce6ff", fontWeight: "700" },
});
