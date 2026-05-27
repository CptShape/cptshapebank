# CptShapeBank

Cross-platform personal finance tracker built with Expo React Native + Firebase Auth + Firestore.

## What it includes

- Android + web from one codebase
- Firebase email/password login and signup
- User-scoped Firestore data
- Wallets with icon, currency, balance, rename, and delete flows
- Transactions for income, outcome, and wallet-to-wallet transfers
- Wallet-specific history
- Subscription tracking with renewal confirmation events
- Summary totals for income, spending, balances, and this month's subscription need

## Firebase setup

1. Create a Firebase project.
2. Enable Authentication with the Email/Password provider.
3. Create a Firestore database.
4. Copy `.env.example` to `.env`.
5. Fill in the `EXPO_PUBLIC_FIREBASE_*` values from your Firebase project settings.
6. Publish the Firestore rules from [firestore.rules](/C:/Users/yasla/Documents/CptShapeBank/firestore.rules) so authenticated users can read and write only their own data.

```bash
firebase deploy --only firestore:rules
```

If you have not deployed rules yet, login can still work while wallet and transaction writes fail with a Firestore permission error.

## Install and run

```bash
npm install
npm run web
```

For Android:

```bash
npm run android
```

Or run the shared Expo dev server:

```bash
npm start
```

## Build targets

- Web: `npx expo export --platform web`
- Android local run: `npx expo run:android`
- Android cloud build: `npx eas build --platform android`

## Windows use

After running the web build or web dev version in your browser, you can install it as a desktop app from Chromium-based browsers using the browser's "Install app" option.
