# Windows Guide

## 1. Open The Project

```powershell
cd C:\Users\yasla\Documents\CptShapeBank
```

What it does:
- moves the terminal into the project folder

## 2. Install Dependencies

```powershell
npm.cmd install
```

What it does:
- installs the app packages

## 3. Check For Type Errors

```powershell
npm.cmd run lint
```

What it does:
- runs the TypeScript check before running or building the desktop app

## 4. Open The App In A Desktop Window

```powershell
npm.cmd run desktop
```

What it does:
- builds the latest web files
- opens the app in an Electron desktop window

## 5. Build A Windows Installer

```powershell
npm.cmd run desktop:build
```

What it does:
- builds the latest web files
- creates a Windows installer `.exe`
- uses the default Windows install path for reliable auto-updates

## 6. Publish A New Windows Release To GitHub

```powershell
npm.cmd run desktop:release
```

What it does:
- reads `GH_TOKEN` from `.env`
- uploads the Windows installer and update files to GitHub Releases

## 7. Find The Built Installer

```text
C:\Users\yasla\Documents\CptShapeBank\desktop-release
```

What it does:
- contains the Windows installer output
