import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

type RememberedAccount = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  rememberedAccounts: RememberedAccount[];
  loginWithSavedAccount: (email: string) => Promise<void>;
  forgetSavedAccount: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const savedAccountsKey = "cptshapebank:rememberedAccounts";

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [rememberedAccounts, setRememberedAccounts] = useState<RememberedAccount[]>([]);

  useEffect(() => {
    void AsyncStorage.getItem(savedAccountsKey).then((value) => {
      if (!value) {
        return;
      }
      try {
        setRememberedAccounts(JSON.parse(value) as RememberedAccount[]);
      } catch {
        setRememberedAccounts([]);
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        await AsyncStorage.setItem("cptshapebank:lastUser", nextUser.email ?? "");
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  async function persistRememberedAccounts(nextAccounts: RememberedAccount[]) {
    setRememberedAccounts(nextAccounts);
    await AsyncStorage.setItem(savedAccountsKey, JSON.stringify(nextAccounts));
  }

  async function rememberAccount(email: string, password: string) {
    const normalizedEmail = email.trim();
    const nextAccounts = [
      { email: normalizedEmail, password },
      ...rememberedAccounts.filter((account) => account.email !== normalizedEmail),
    ].slice(0, 5);
    await persistRememberedAccounts(nextAccounts);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      rememberedAccounts,
      login: async (email, password) => {
        const normalizedEmail = email.trim();
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        await rememberAccount(normalizedEmail, password);
      },
      signup: async (email, password) => {
        const normalizedEmail = email.trim();
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            email: credential.user.email,
            createdAt: new Date().toISOString(),
          },
          { merge: true },
        );
        await rememberAccount(normalizedEmail, password);
      },
      logout: async () => {
        await signOut(auth);
      },
      loginWithSavedAccount: async (email) => {
        const account = rememberedAccounts.find((item) => item.email === email);
        if (!account) {
          throw new Error("Saved account not found on this device.");
        }
        await signInWithEmailAndPassword(auth, account.email, account.password);
      },
      forgetSavedAccount: async (email) => {
        await persistRememberedAccounts(rememberedAccounts.filter((account) => account.email !== email));
      },
    }),
    [initializing, rememberedAccounts, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
