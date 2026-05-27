import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { FormField } from "../components/FormField";
import { showMessage } from "../services/feedback";

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (error) {
      showMessage("Authentication failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LinearGradient colors={["#07101f", "#101b3c", "#1b2c57"]} style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>CptShapeBank</Text>
        <Text style={styles.title}>Money tracking that feels clean, fast, and personal.</Text>
        <Text style={styles.subtitle}>
          Sign in to sync your wallets, transactions, subscriptions, and history across Android and the web.
        </Text>

        <View style={styles.segment}>
          <Pressable onPress={() => setMode("login")} style={[styles.segmentButton, mode === "login" && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>Log in</Text>
          </Pressable>
          <Pressable onPress={() => setMode("signup")} style={[styles.segmentButton, mode === "signup" && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === "signup" && styles.segmentTextActive]}>Sign up</Text>
          </Pressable>
        </View>

        <FormField keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
        <FormField label="Password" onChangeText={setPassword} secureTextEntry value={password} />

        <Pressable disabled={busy} onPress={() => void handleSubmit()} style={styles.submit}>
          <Text style={styles.submitText}>{busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center", padding: 18 },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "rgba(8, 14, 30, 0.94)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14,
  },
  eyebrow: { color: "#5eead4", fontSize: 13, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  title: { color: "#f8fbff", fontSize: 30, fontWeight: "800", lineHeight: 36 },
  subtitle: { color: "#adc0ea", fontSize: 15, lineHeight: 22, marginBottom: 8 },
  segment: { flexDirection: "row", gap: 10, backgroundColor: "#101b36", borderRadius: 16, padding: 6 },
  segmentButton: { flex: 1, borderRadius: 12, alignItems: "center", paddingVertical: 12 },
  segmentActive: { backgroundColor: "#5eead4" },
  segmentText: { color: "#dce6ff", fontWeight: "700" },
  segmentTextActive: { color: "#082032" },
  submit: {
    backgroundColor: "#5eead4",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },
  submitText: { color: "#082032", fontSize: 16, fontWeight: "800" },
});
