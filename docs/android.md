# Android Guide

## 1. Open The Project

```powershell
cd C:\Users\yasla\Documents\CptShapeBank
```

What it does:
- moves the terminal into the project folder

## 2. Install Dependencies

```powershell
npm install
```

What it does:
- installs the app packages

## 3. Check For Type Errors

```powershell
npm run lint
```

What it does:
- runs the TypeScript check before testing or building

## 4. Fast Android Testing With Expo Go

```powershell
npx expo start
```

What it does:
- starts the Expo development server
- shows a QR code in the terminal/browser

Then:
- open Expo Go on your Android phone
- scan the QR code
- the app opens on your phone for fast testing

## 5. Install The Local Android SDK

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-android-sdk.ps1
```

What it does:
- downloads the official Android command-line tools
- installs the Android SDK locally in this project
- installs `platform-tools`, `platforms;android-36`, and `build-tools;36.0.0`
- sets `JAVA_HOME`, `ANDROID_HOME`, and `ANDROID_SDK_ROOT` for your user

## 6. Open A New Terminal

```powershell
cd C:\Users\yasla\Documents\CptShapeBank
```

What it does:
- reloads the user environment variables after Android SDK setup

## 7. Build And Run On Android Locally

```powershell
npm.cmd run android
```

What it does:
- uses the local SDK in `.android-sdk`
- creates the native Android project if needed
- builds the Android app locally on your computer
- installs it on a connected Android device or running emulator

## 8. Log In To Expo For Cloud Builds

```powershell
eas login
```

What it does:
- logs your computer into your Expo account
- required for cloud Android builds

## 9. Build An Installable Android APK

```powershell
eas build --platform android --profile preview
```

What it does:
- sends the project to Expo cloud build servers
- creates an installable Android APK for your devices

If asked:

```text
Generate a new Android Keystore?
```

Choose:

```text
Yes
```

What it does:
- creates the Android signing key required for installation

## 10. Download The APK

After the build finishes, Expo prints a build URL.

What to do:
- open the URL
- download the APK
- send it to your Android device
- install it on the device

## Short Version

Fast phone testing:

```powershell
cd C:\Users\yasla\Documents\CptShapeBank
npm install
npm run lint
npx expo start
```

Local Android build:

```powershell
cd C:\Users\yasla\Documents\CptShapeBank
npm.cmd install
npm.cmd run lint
powershell -ExecutionPolicy Bypass -File .\scripts\setup-android-sdk.ps1
```

Then open a new terminal and run:

```powershell
cd C:\Users\yasla\Documents\CptShapeBank
npm.cmd run android
```

APK build:

```powershell
cd C:\Users\yasla\Documents\CptShapeBank
npm install
npm run lint
eas login
eas build --platform android --profile preview
```
