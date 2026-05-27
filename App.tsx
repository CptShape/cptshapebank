import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { DataProvider, useData } from "./src/context/DataContext";
import { AuthScreen } from "./src/screens/AuthScreen";
import { WalletsScreen } from "./src/screens/WalletsScreen";
import { TransactionScreen } from "./src/screens/TransactionScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { SubscriptionsScreen } from "./src/screens/SubscriptionsScreen";
import { SummaryScreen } from "./src/screens/SummaryScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { showMessage } from "./src/services/feedback";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#09101f",
    card: "#0f1830",
    text: "#f8fbff",
    border: "rgba(255,255,255,0.12)",
    primary: "#5eead4",
  },
};

function AppTabs() {
  const { pendingEvents, resolveSubscriptionEvent } = useData();
  const activeEvent = pendingEvents[0];
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: 66 + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ],
          tabBarActiveTintColor: "#5eead4",
          tabBarInactiveTintColor: "#8fa0c9",
          tabBarIcon: ({ color, size }) => {
            const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
              Wallets: "wallet-outline",
              Transaction: "swap-horizontal-outline",
              History: "time-outline",
              Subscriptions: "repeat-outline",
              Summary: "stats-chart-outline",
              Settings: "settings-outline",
            };
            return <Ionicons color={color} name={iconMap[route.name]} size={size} />;
          },
        })}
      >
        <Tab.Screen component={WalletsScreen} name="Wallets" />
        <Tab.Screen component={TransactionScreen} name="Transaction" />
        <Tab.Screen component={HistoryScreen} name="History" />
        <Tab.Screen component={SubscriptionsScreen} name="Subscriptions" />
        <Tab.Screen component={SummaryScreen} name="Summary" />
        <Tab.Screen component={SettingsScreen} name="Settings" />
      </Tab.Navigator>

      <Modal animationType="slide" transparent visible={Boolean(activeEvent)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>Subscription Renewal</Text>
            <Text style={styles.modalTitle}>{activeEvent?.name}</Text>
            <Text style={styles.modalCopy}>
              {activeEvent?.walletName} should be charged {activeEvent?.formattedPrice} for the renewal due on {activeEvent?.dueDate}.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  if (activeEvent) {
                    void resolveSubscriptionEvent(activeEvent.id, false);
                  }
                }}
                style={[styles.modalButton, styles.modalButtonMuted]}
              >
                <Text style={styles.modalButtonText}>No, deactivate</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (activeEvent) {
                    void resolveSubscriptionEvent(activeEvent.id, true).catch((error) => {
                      showMessage("Could not process renewal", error.message);
                    });
                  }
                }}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextDark]}>Yes, spend it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function AppContent() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <LinearGradient colors={["#08101f", "#13203f"]} style={styles.loaderScreen}>
        <ActivityIndicator color="#5eead4" size="large" />
      </LinearGradient>
    );
  }

  return user ? (
    <DataProvider>
      <AppTabs />
    </DataProvider>
  ) : (
    <AuthScreen />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    position: "absolute",
    backgroundColor: "rgba(9, 16, 31, 0.96)",
    borderTopColor: "rgba(255,255,255,0.08)",
    height: 76,
    paddingBottom: 10,
    paddingTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 6, 16, 0.72)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#0f1830",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 12,
  },
  modalEyebrow: {
    color: "#5eead4",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  modalTitle: {
    color: "#f8fbff",
    fontSize: 24,
    fontWeight: "800",
  },
  modalCopy: {
    color: "#b9c5e5",
    fontSize: 15,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonMuted: {
    backgroundColor: "#1d2b4d",
  },
  modalButtonPrimary: {
    backgroundColor: "#5eead4",
  },
  modalButtonText: {
    color: "#dce6ff",
    fontWeight: "700",
  },
  modalButtonTextDark: {
    color: "#082032",
  },
});
