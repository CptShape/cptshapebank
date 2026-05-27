import { Alert, Platform } from "react-native";

export function showMessage(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

export async function confirmDestructive(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.confirm(`${title}\n\n${message}`);
  }

  return await new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}
