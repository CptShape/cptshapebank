import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function TimePickerField({ label, onChange, value }: Props) {
  const [open, setOpen] = useState(false);
  const [hour, minute] = value.split(":");
  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => `${index}`.padStart(2, "0")), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, index) => `${index}`.padStart(2, "0")), []);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger}>
        <Text style={styles.value}>{value}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Select Time</Text>
            <View style={styles.columns}>
              <View style={styles.column}>
                <Text style={styles.columnLabel}>Hour</Text>
                <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroller}>
                  {hours.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => onChange(`${item}:${minute}`)}
                      style={[styles.option, item === hour && styles.optionActive]}
                    >
                      <Text style={[styles.optionText, item === hour && styles.optionTextActive]}>{item}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.column}>
                <Text style={styles.columnLabel}>Minute</Text>
                <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroller}>
                  {minutes.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => onChange(`${hour}:${item}`)}
                      style={[styles.option, item === minute && styles.optionActive]}
                    >
                      <Text style={[styles.optionText, item === minute && styles.optionTextActive]}>{item}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Pressable onPress={() => setOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { color: "#dce6ff", fontSize: 14, fontWeight: "700" },
  trigger: {
    backgroundColor: "rgba(11, 18, 37, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  value: { color: "#f8fbff", fontSize: 15 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(1, 6, 18, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    maxHeight: 460,
    backgroundColor: "#0f1830",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14,
  },
  title: { color: "#f8fbff", fontSize: 18, fontWeight: "800", textAlign: "center" },
  columns: { flexDirection: "row", gap: 12 },
  column: { flex: 1, gap: 8 },
  columnLabel: { color: "#90a4cf", fontSize: 12, textAlign: "center", textTransform: "uppercase" },
  scroller: {
    maxHeight: 280,
    backgroundColor: "rgba(8, 14, 30, 0.92)",
    borderRadius: 18,
  },
  scrollContent: { padding: 8, gap: 6 },
  option: { borderRadius: 14, paddingVertical: 10, alignItems: "center" },
  optionActive: { backgroundColor: "#5eead4" },
  optionText: { color: "#dce6ff", fontSize: 16, fontWeight: "700" },
  optionTextActive: { color: "#082032" },
  close: {
    borderRadius: 14,
    backgroundColor: "#1d2b4d",
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: { color: "#dce6ff", fontWeight: "700" },
});
