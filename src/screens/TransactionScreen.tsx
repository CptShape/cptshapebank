import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DatePickerField } from "../components/DatePickerField";
import { TimePickerField } from "../components/TimePickerField";
import { useData } from "../context/DataContext";
import { ScreenLayout } from "../components/ScreenLayout";
import { SectionCard } from "../components/SectionCard";
import { FormField } from "../components/FormField";
import { OptionSelector } from "../components/OptionSelector";
import { showMessage } from "../services/feedback";
import { datePartFromIso, timePartsFromIso, toIsoFromDateAndTime } from "../services/subscriptions";

const nowIso = new Date().toISOString();
const nowTime = timePartsFromIso(nowIso);
const initialForm = {
  source: "income",
  destination: "outcome",
  amount: "",
  note: "",
  date: datePartFromIso(nowIso),
  time: `${nowTime.hour}:${nowTime.minute}`,
};

export function TransactionScreen() {
  const { createTransaction, wallets } = useData();
  const [form, setForm] = useState(initialForm);

  const sourceOptions = useMemo(
    () => [{ label: "Income", value: "income" }, ...wallets.map((wallet) => ({ label: wallet.name, value: wallet.id }))],
    [wallets],
  );
  const destinationOptions = useMemo(
    () => [{ label: "Outcome", value: "outcome" }, ...wallets.map((wallet) => ({ label: wallet.name, value: wallet.id }))],
    [wallets],
  );

  const sourceIsWallet = form.source !== "income";
  const destinationIsWallet = form.destination !== "outcome";
  const showDescription = form.source === "income" || form.destination === "outcome";
  const isWalletTransfer = sourceIsWallet && destinationIsWallet;

  async function handleSave() {
    try {
      const amount = Number(form.amount);
      if (!amount || amount <= 0) {
        throw new Error("Please enter a positive amount.");
      }
      await createTransaction({
        sourceType: sourceIsWallet ? "wallet" : "income",
        sourceWalletId: sourceIsWallet ? form.source : undefined,
        destinationType: destinationIsWallet ? "wallet" : "outcome",
        destinationWalletId: destinationIsWallet ? form.destination : undefined,
        amount,
        date: form.date,
        occurredAt: toIsoFromDateAndTime(form.date, form.time.split(":")[0], form.time.split(":")[1]),
        note: isWalletTransfer ? "Transfer between wallets" : form.note,
      });
      const resetIso = new Date().toISOString();
      const resetTime = timePartsFromIso(resetIso);
      setForm({ ...initialForm, date: datePartFromIso(resetIso), time: `${resetTime.hour}:${resetTime.minute}` });
    } catch (error) {
      showMessage("Transaction failed", error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <ScreenLayout
      subtitle="Move money between wallets, log expenses, or record income with date and description."
      title="Transaction"
    >
      <SectionCard title="Create Transaction">
        <OptionSelector
          label="Source"
          onChange={(source) => setForm((current) => ({ ...current, source }))}
          options={sourceOptions}
          value={form.source}
        />
        <OptionSelector
          label="Destination"
          onChange={(destination) => setForm((current) => ({ ...current, destination }))}
          options={destinationOptions}
          value={form.destination}
        />
        {showDescription ? (
          <FormField
            label={form.source === "income" ? "Income Description" : "Outcome Description"}
            onChangeText={(note) => setForm((current) => ({ ...current, note }))}
            placeholder={form.source === "income" ? "Salary, gift, freelance..." : "Groceries, rent, coffee..."}
            value={form.note}
          />
        ) : (
          <Text style={styles.transferNote}>Description will be saved as "Transfer between wallets".</Text>
        )}
        <View style={styles.row}>
          <View style={styles.flex}>
            <DatePickerField
              label="Date"
              onChange={(date) => setForm((current) => ({ ...current, date }))}
              value={form.date}
            />
          </View>
          <View style={styles.flex}>
            <TimePickerField
              label="Time"
              onChange={(time) => setForm((current) => ({ ...current, time }))}
              value={form.time}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.flex}>
            <FormField
              keyboardType="numeric"
              label="Amount"
              onChangeText={(amount) => setForm((current) => ({ ...current, amount }))}
              value={form.amount}
            />
          </View>
        </View>
        <Text style={styles.helper}>At least one side must be a wallet. Transactions are ordered using the chosen date and time.</Text>
        <Pressable onPress={() => void handleSave()} style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>Accept transaction</Text>
        </Pressable>
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  helper: { color: "#90a4cf", fontSize: 13, lineHeight: 20 },
  transferNote: { color: "#90a4cf", fontSize: 13, lineHeight: 20 },
  primaryAction: {
    backgroundColor: "#5eead4",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryActionText: { color: "#082032", fontWeight: "800", fontSize: 15 },
});
