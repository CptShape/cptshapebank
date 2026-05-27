import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TotalsByCurrency } from "../types";
import { formatCurrency } from "../services/subscriptions";

export function AmountList({
  emptyLabel,
  totals,
}: {
  emptyLabel: string;
  totals: TotalsByCurrency;
}) {
  const entries = Object.entries(totals);
  if (entries.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {entries.map(([currency, value]) => (
        <View key={currency} style={styles.row}>
          <Text style={styles.label}>{currency}</Text>
          <Text style={styles.value}>{formatCurrency(value, currency)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { color: "#dce6ff", fontSize: 14, fontWeight: "700" },
  value: { color: "#f8fbff", fontSize: 14, fontWeight: "800" },
  empty: { color: "#90a4cf", fontSize: 14 },
});
