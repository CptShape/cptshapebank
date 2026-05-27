import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean;
};

export function FormField(props: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        keyboardType={props.keyboardType}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#60749f"
        secureTextEntry={props.secureTextEntry}
        style={styles.input}
        value={props.value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { color: "#dce6ff", fontSize: 14, fontWeight: "700" },
  input: {
    backgroundColor: "rgba(11, 18, 37, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#f8fbff",
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
