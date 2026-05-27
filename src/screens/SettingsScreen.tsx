import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { ScreenLayout } from "../components/ScreenLayout";
import { SectionCard } from "../components/SectionCard";
import { showMessage } from "../services/feedback";

export function SettingsScreen() {
  const { logout, user } = useAuth();

  return (
    <ScreenLayout subtitle="Your account controls and Firebase-backed sync live here." title="Settings">
      <SectionCard title="Account">
        <View style={styles.infoRow}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <Pressable
          onPress={() => {
            void logout().catch((error) => {
              showMessage("Logout failed", error.message);
            });
          }}
          style={styles.logout}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </SectionCard>
      <SectionCard title="Build Notes">
        <Text style={styles.copy}>
          The same codebase runs on Android and web. On Windows, you can use the web build directly or install the web app from your browser as a desktop app.
        </Text>
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  infoRow: { gap: 6 },
  label: { color: "#90a4cf", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 },
  value: { color: "#f8fbff", fontSize: 18, fontWeight: "700" },
  logout: {
    backgroundColor: "#fb7185",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: "#fff6f7", fontWeight: "800", fontSize: 15 },
  copy: { color: "#dce6ff", fontSize: 15, lineHeight: 22 },
});
