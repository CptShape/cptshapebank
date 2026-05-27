import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      login: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signup: async (email, password) => {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(
          doc(db, "users", credential.user.uid),
          {
            email: credential.user.email,
            createdAt: new Date().toISOString(),
          },
          { merge: true },
        );
      },
      logout: async () => {
        await signOut(auth);
      },
    }),
    [initializing, user],
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
