import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = React.PropsWithChildren<{
  title: string;
  subtitle: string;
  scroll?: boolean;
}>;

export function ScreenLayout({ children, title, subtitle, scroll = true }: Props) {
  const content = (
    <View style={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <LinearGradient colors={["#07101f", "#0c1630", "#121f45"]} style={styles.root}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 18, paddingBottom: 120 },
  content: { flex: 1, padding: 18, paddingBottom: 120, gap: 16 },
  hero: { gap: 6, paddingTop: 32, paddingBottom: 6 },
  title: { color: "#f8fbff", fontSize: 32, fontWeight: "800" },
  subtitle: { color: "#adc0ea", fontSize: 15, lineHeight: 22, maxWidth: 560 },
});
