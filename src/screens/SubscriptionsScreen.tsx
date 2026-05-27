import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { subscriptionIntervals } from "../constants";
import { useData } from "../context/DataContext";
import { ScreenLayout } from "../components/ScreenLayout";
import { SectionCard } from "../components/SectionCard";
import { FormField } from "../components/FormField";
import { OptionSelector } from "../components/OptionSelector";
import { showMessage } from "../services/feedback";
import { compareDateOnly, formatCurrency, parseDateOnly, todayIso } from "../services/subscriptions";

const initialForm = {
  name: "",
  price: "",
  walletId: "",
  interval: "monthly",
  nextRenewalDate: todayIso(),
};

export function SubscriptionsScreen() {
  const { addSubscription, subscriptions, updateSubscription, wallets } = useData();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const walletOptions = useMemo(
    () => wallets.map((wallet) => ({ label: `${wallet.name} (${wallet.currency})`, value: wallet.id })),
    [wallets],
  );
  const sortedSubscriptions = useMemo(
    () =>
      [...subscriptions].sort((left, right) => {
        const byDate = compareDateOnly(left.nextRenewalDate, right.nextRenewalDate);
        return byDate !== 0 ? byDate : left.name.localeCompare(right.name);
      }),
    [subscriptions],
  );

  async function handleSave() {
    try {
      const price = Number(form.price);
      if (!form.name.trim()) {
        throw new Error("Please enter a subscription name.");
      }
      if (!form.walletId) {
        throw new Error("Please choose the connected wallet.");
      }
      if (!price || price <= 0) {
        throw new Error("Please enter a valid subscription price.");
      }
      const payload = {
        name: form.name.trim(),
        price,
        walletId: form.walletId,
        interval: form.interval as "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
        nextRenewalDate: form.nextRenewalDate,
      };

      if (editingId) {
        await updateSubscription(editingId, payload);
      } else {
        await addSubscription(payload);
      }
      setForm(initialForm);
      setEditingId(null);
    } catch (error) {
      showMessage(
        editingId ? "Subscription could not be updated" : "Subscription could not be added",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  return (
    <ScreenLayout
      subtitle="Track recurring payments and decide on each renewal whether they should actually spend from the wallet."
      title="Subscriptions"
    >
      <SectionCard title={editingId ? "Edit Subscription" : "Add Subscription"}>
        <FormField
          label="Name"
          onChangeText={(name) => setForm((current) => ({ ...current, name }))}
          placeholder="Netflix, iCloud, Gym..."
          value={form.name}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <FormField
              keyboardType="numeric"
              label="Price"
              onChangeText={(price) => setForm((current) => ({ ...current, price }))}
              value={form.price}
            />
          </View>
          <View style={styles.flex}>
            <FormField
              label="Renewal Date"
              onChangeText={(nextRenewalDate) => setForm((current) => ({ ...current, nextRenewalDate }))}
              placeholder="YYYY-MM-DD"
              value={form.nextRenewalDate}
            />
          </View>
        </View>
        <OptionSelector
          label="Interval"
          onChange={(interval) => setForm((current) => ({ ...current, interval }))}
          options={subscriptionIntervals}
          value={form.interval}
        />
        <OptionSelector
          label="Connected Wallet"
          onChange={(walletId) => setForm((current) => ({ ...current, walletId }))}
          options={walletOptions}
          value={form.walletId}
        />
        <View style={styles.actionRow}>
          <Pressable onPress={() => void handleSave()} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>{editingId ? "Save changes" : "Add subscription"}</Text>
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

      <SectionCard title="Tracked Renewals">
        {subscriptions.length === 0 ? (
          <Text style={styles.empty}>No subscriptions yet.</Text>
        ) : (
          sortedSubscriptions.map((subscription) => (
            <View key={subscription.id} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionText}>
                  <Text style={styles.subscriptionName}>{subscription.name}</Text>
                  <Text style={styles.subscriptionMeta}>
                    {subscription.walletName} • {subscription.interval} • renews {subscription.nextRenewalDate}
                  </Text>
                  <Text style={styles.daysRemaining}>{getDaysRemainingLabel(subscription.nextRenewalDate)}</Text>
                </View>
                <Text style={styles.subscriptionPrice}>{formatCurrency(subscription.price, subscription.currency)}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.status, subscription.active ? styles.statusActive : styles.statusInactive]}>
                  {subscription.active ? "Active" : "Inactive"}
                </Text>
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => {
                      setEditingId(subscription.id);
                      setForm({
                        name: subscription.name,
                        price: String(subscription.price),
                        walletId: subscription.walletId,
                        interval: subscription.interval,
                        nextRenewalDate: subscription.nextRenewalDate,
                      });
                    }}
                    style={styles.secondaryAction}
                  >
                    <Text style={styles.secondaryActionText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void updateSubscription(subscription.id, { active: !subscription.active }).catch((error) => {
                        showMessage("Could not update subscription", error.message);
                      });
                    }}
                    style={styles.secondaryAction}
                  >
                    <Text style={styles.secondaryActionText}>{subscription.active ? "Deactivate" : "Activate"}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  actionRow: { flexDirection: "row", gap: 12 },
  primaryAction: {
    flex: 1,
    backgroundColor: "#5eead4",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryActionText: { color: "#082032", fontWeight: "800", fontSize: 15 },
  empty: { color: "#90a4cf", fontSize: 14 },
  subscriptionCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#101b36",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  subscriptionHeader: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  subscriptionText: { flex: 1, gap: 4 },
  subscriptionName: { color: "#f8fbff", fontSize: 16, fontWeight: "800" },
  subscriptionMeta: { color: "#9fb1db", fontSize: 13 },
  daysRemaining: { color: "#5eead4", fontSize: 12, fontWeight: "700" },
  subscriptionPrice: { color: "#5eead4", fontSize: 16, fontWeight: "800" },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardActions: { flexDirection: "row", gap: 10 },
  status: { fontSize: 13, fontWeight: "800" },
  statusActive: { color: "#5eead4" },
  statusInactive: { color: "#fb7185" },
  secondaryAction: {
    borderRadius: 14,
    backgroundColor: "#1d2b4d",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryActionText: { color: "#dce6ff", fontWeight: "700" },
});

function getDaysRemainingLabel(dateIso: string) {
  const today = parseDateOnly(todayIso()).getTime();
  const renewal = parseDateOnly(dateIso).getTime();
  const diff = Math.round((renewal - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) {
    return "Due today";
  }
  if (diff < 0) {
    const overdue = Math.abs(diff);
    return `${overdue} day${overdue === 1 ? "" : "s"} overdue`;
  }
  return `${diff} day${diff === 1 ? "" : "s"} remaining`;
}
