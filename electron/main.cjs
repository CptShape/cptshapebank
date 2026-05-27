const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { autoUpdater } = require("electron-updater");

let mainWindow = null;
let staticServer = null;
const desktopPort = 39677;
let installWhenReady = false;
let isInstallingUpdate = false;
let updateState = {
  status: "idle",
  message: "",
  currentVersion: app.getVersion(),
  availableVersion: null,
};

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".txt": "text/plain; charset=utf-8",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  };
  return types[extension] ?? "application/octet-stream";
}

function startStaticServer() {
  if (staticServer) {
    return Promise.resolve(staticServer);
  }

  const distRoot = path.join(__dirname, "..", "dist");

  return new Promise((resolve) => {
    staticServer = http.createServer((request, response) => {
      const requested = decodeURIComponent((request.url ?? "/").split("?")[0]);
      const relativePath = requested === "/" ? "index.html" : requested.replace(/^\/+/, "");
      const candidatePath = path.normalize(path.join(distRoot, relativePath));
      const safePath = candidatePath.startsWith(distRoot) ? candidatePath : path.join(distRoot, "index.html");
      const finalPath = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(distRoot, "index.html");

      fs.readFile(finalPath, (error, file) => {
        if (error) {
          response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          response.end("Could not load desktop app files.");
          return;
        }

        response.writeHead(200, { "Content-Type": contentTypeFor(finalPath) });
        response.end(file);
      });
    });

    staticServer.listen(desktopPort, "127.0.0.1", () => {
      resolve(staticServer);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 720,
    backgroundColor: "#09101f",
    autoHideMenuBar: true,
    title: "CptShapeBank",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  const devUrl = process.env.CPTSHAPEBANK_DESKTOP_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    const server = await startStaticServer();
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Could not start local desktop server.");
    }
    await mainWindow.loadURL(`http://127.0.0.1:${address.port}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function publishUpdateState() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  mainWindow.webContents.send("updater:state", updateState);
}

function setUpdateState(patch) {
  updateState = {
    ...updateState,
    ...patch,
    currentVersion: app.getVersion(),
  };
  publishUpdateState();
}

function installDownloadedUpdate() {
  if (!app.isPackaged) {
    return;
  }

  isInstallingUpdate = true;
  installWhenReady = false;
  shutdownServer();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }

  setImmediate(() => {
    autoUpdater.quitAndInstall(true, true);
  });
}

function configureAutoUpdater() {
  if (!app.isPackaged) {
    setUpdateState({
      status: "unsupported",
      message: "Updates only work in the installed Windows app.",
      availableVersion: null,
    });
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.installDirectory = path.dirname(process.execPath);

  autoUpdater.on("checking-for-update", () => {
    setUpdateState({
      status: "checking",
      message: "Checking GitHub Releases for updates...",
      availableVersion: null,
    });
  });

  autoUpdater.on("update-available", (info) => {
    setUpdateState({
      status: "available",
      message: `Version ${info.version} is available.`,
      availableVersion: info.version,
    });
  });

  autoUpdater.on("update-not-available", () => {
    setUpdateState({
      status: "up-to-date",
      message: "You already have the latest version.",
      availableVersion: null,
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    setUpdateState({
      status: "downloading",
      message: `Downloading update... ${Math.round(progress.percent)}%`,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    setUpdateState({
      status: "downloaded",
      message: `Update ${info.version} downloaded and ready to install.`,
      availableVersion: info.version,
    });
    if (installWhenReady) {
      installDownloadedUpdate();
    }
  });

  autoUpdater.on("error", (error) => {
    isInstallingUpdate = false;
    installWhenReady = false;
    setUpdateState({
      status: "error",
      message: error?.message ?? "Could not check for updates.",
    });
  });
}

function shutdownServer() {
  if (!staticServer) {
    return;
  }
  if (typeof staticServer.closeAllConnections === "function") {
    staticServer.closeAllConnections();
  }
  staticServer.close(() => {});
  staticServer = null;
}

app.whenReady().then(() => {
  configureAutoUpdater();
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

ipcMain.handle("updater:get-version", () => app.getVersion());
ipcMain.handle("updater:get-state", () => updateState);
ipcMain.handle("updater:check", async () => {
  if (!app.isPackaged) {
    setUpdateState({
      status: "unsupported",
      message: "Install the Windows app first to check for updates.",
    });
    return updateState;
  }
  installWhenReady = false;
  await autoUpdater.checkForUpdates();
  return updateState;
});

ipcMain.handle("updater:download-install", async () => {
  if (!app.isPackaged) {
    setUpdateState({
      status: "unsupported",
      message: "Install the Windows app first to update it.",
    });
    return updateState;
  }
  installWhenReady = true;
  if (updateState.status === "downloaded") {
    installDownloadedUpdate();
    return updateState;
  }
  setUpdateState({
    status: "downloading",
    message: `Downloading version ${updateState.availableVersion ?? ""}...`.trim(),
  });
  await autoUpdater.downloadUpdate();
  return updateState;
});

app.on("before-quit", () => {
  shutdownServer();
});

app.on("window-all-closed", () => {
  shutdownServer();
  if (process.platform !== "darwin" && !isInstallingUpdate) {
    app.quit();
  }
});
