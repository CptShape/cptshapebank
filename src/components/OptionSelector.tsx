import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FormOption } from "../types";

type Props = {
  label: string;
  options: FormOption[];
  value: string;
  onChange: (value: string) => void;
};

export function OptionSelector({ label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((option) => option.value === value)?.label ?? "Choose an option",
    [options, value],
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger}>
        <Text style={styles.value}>{selected}</Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={[styles.option, option.value === value && styles.optionActive]}
                >
                  <Text style={[styles.optionLabel, option.value === value && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>Close</Text>
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
    backgroundColor: "rgba(1, 6, 18, 0.7)",
    justifyContent: "center",
    padding: 18,
  },
  sheet: {
    backgroundColor: "#0f1830",
    borderRadius: 24,
    padding: 18,
    maxHeight: "75%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetTitle: { color: "#f8fbff", fontSize: 18, fontWeight: "800", marginBottom: 12 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  optionActive: { backgroundColor: "rgba(94,234,212,0.12)" },
  optionLabel: { color: "#dce6ff", fontSize: 15 },
  optionLabelActive: { color: "#5eead4", fontWeight: "700" },
  close: {
    marginTop: 12,
    backgroundColor: "#1d2b4d",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 12,
  },
  closeText: { color: "#dce6ff", fontWeight: "700" },
});
