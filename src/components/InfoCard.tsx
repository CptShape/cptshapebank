import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function InfoCard({
  title,
  value,
  tone = "teal",
}: {
  title: string;
  value: string;
  tone?: "teal" | "orange" | "blue";
}) {
  const toneStyle = tone === "orange" ? styles.orange : tone === "blue" ? styles.blue : styles.teal;
  return (
    <View style={[styles.card, toneStyle]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    minHeight: 110,
    justifyContent: "space-between",
    borderWidth: 1,
  },
  teal: {
    backgroundColor: "rgba(20, 48, 68, 0.95)",
    borderColor: "rgba(94,234,212,0.24)",
  },
  orange: {
    backgroundColor: "rgba(60, 39, 18, 0.95)",
    borderColor: "rgba(251,146,60,0.24)",
  },
  blue: {
    backgroundColor: "rgba(20, 33, 70, 0.95)",
    borderColor: "rgba(96,165,250,0.22)",
  },
  title: { color: "#dce6ff", fontSize: 14, fontWeight: "700" },
  value: { color: "#f8fbff", fontSize: 22, fontWeight: "800", lineHeight: 28 },
});
