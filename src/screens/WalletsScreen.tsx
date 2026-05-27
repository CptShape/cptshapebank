import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { currencyOptions, walletIcons } from "../constants";
import { useData } from "../context/DataContext";
import { ScreenLayout } from "../components/ScreenLayout";
import { SectionCard } from "../components/SectionCard";
import { FormField } from "../components/FormField";
import { OptionSelector } from "../components/OptionSelector";
import { AmountList } from "../components/AmountList";
import { WalletCard } from "../components/WalletCard";
import { confirmDestructive, showMessage } from "../services/feedback";

const initialForm = {
  name: "",
  balance: "",
  currency: "TRY",
  icon: walletIcons[0],
  isCreditCard: false,
};

export function WalletsScreen() {
  const { addWallet, deleteWallet, next30DaySubscriptionNeedByWallet, totalsByCurrency, updateWallet, wallets } = useData();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const iconOptions = useMemo(() => walletIcons.map((icon) => ({ label: icon, value: icon })), []);

  async function saveWallet() {
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon,
        currency: form.currency,
        balance: Number(form.balance || "0"),
        isCreditCard: form.isCreditCard,
      };
      if (!payload.name) {
        throw new Error("Please give the wallet a name.");
      }
      if (Number.isNaN(payload.balance)) {
        throw new Error("Starting balance must be a number.");
      }

      if (editingId) {
        await updateWallet(editingId, payload);
      } else {
        await addWallet(payload);
      }
      setForm(initialForm);
      setEditingId(null);
    } catch (error) {
      showMessage("Wallet could not be saved", error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <ScreenLayout subtitle="Create separate wallets for banks, cards, cash, and anything else you want to track." title="Wallets">
      <SectionCard title="Portfolio Totals">
        <AmountList emptyLabel="Add your first wallet to see totals by currency." totals={totalsByCurrency} />
      </SectionCard>

      <SectionCard title={editingId ? "Edit Wallet" : "Add Wallet"}>
        <FormField
          label="Wallet Name"
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
          placeholder="VakifBank, Cash, Revolut..."
          value={form.name}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <FormField
              keyboardType="numeric"
              label="Starting Balance"
              onChangeText={(balance) => setForm((current) => ({ ...current, balance }))}
              value={form.balance}
            />
          </View>
          <View style={styles.flex}>
            <OptionSelector
              label="Currency"
              onChange={(currency) => setForm((current) => ({ ...current, currency }))}
              options={currencyOptions}
              value={form.currency}
            />
          </View>
        </View>
        <OptionSelector
          label="Icon"
          onChange={(icon) => setForm((current) => ({ ...current, icon }))}
          options={iconOptions}
          value={form.icon}
        />
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchLabel}>Credit Card</Text>
            <Text style={styles.switchHint}>Allows spending even when the balance goes below zero.</Text>
          </View>
          <Switch
            onValueChange={(isCreditCard) => setForm((current) => ({ ...current, isCreditCard }))}
            thumbColor={form.isCreditCard ? "#5eead4" : "#c8d2ee"}
            trackColor={{ false: "#2a3558", true: "#1a6d66" }}
            value={form.isCreditCard}
          />
        </View>
        <View style={styles.row}>
          <Pressable onPress={() => void saveWallet()} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>{editingId ? "Save changes" : "Add wallet"}</Text>
          </Pressable>
          {editingId ? (
            <Pressable
              onPress={() => {
                setEditingId(null);
                setForm(initialForm);
              }}
              style={styles.secondaryAction}
            >
              <Text style={styles.secondaryActionText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard title="Your Wallets">
        {wallets.length === 0 ? (
          <Text style={styles.empty}>No wallets yet. Add your first one above.</Text>
        ) : (
          wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              onDelete={() => {
                void confirmDestructive("Delete wallet", "Only unused wallets can be deleted.").then((confirmed) => {
                  if (!confirmed) {
                    return;
                  }
                  void deleteWallet(wallet.id).catch((error) => {
                    showMessage("Could not delete wallet", error.message);
                  });
                });
              }}
              onEdit={() => {
                setEditingId(wallet.id);
                setForm({
                  name: wallet.name,
                  balance: String(wallet.balance),
                  currency: wallet.currency,
                  icon: wallet.icon,
                  isCreditCard: wallet.isCreditCard,
                });
              }}
              next30DaySubscriptionNeed={next30DaySubscriptionNeedByWallet[wallet.id] ?? 0}
              wallet={wallet}
            />
          ))
        )}
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  primaryAction: {
    flex: 1,
    backgroundColor: "#5eead4",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryActionText: { color: "#082032", fontWeight: "800", fontSize: 15 },
  secondaryAction: {
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "#1b284a",
    justifyContent: "center",
  },
  secondaryActionText: { color: "#dce6ff", fontWeight: "700" },
  empty: { color: "#90a4cf", fontSize: 14 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "rgba(11, 18, 37, 0.85)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchTextWrap: { flex: 1, gap: 4 },
  switchLabel: { color: "#dce6ff", fontSize: 14, fontWeight: "700" },
  switchHint: { color: "#90a4cf", fontSize: 12, lineHeight: 18 },
});
