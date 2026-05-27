import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function SectionCard({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(10, 17, 35, 0.94)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    gap: 16,
  },
  title: { color: "#f8fbff", fontSize: 18, fontWeight: "800" },
  content: { gap: 14 },
});
