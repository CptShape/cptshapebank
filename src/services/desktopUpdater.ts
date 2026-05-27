export type DesktopUpdateState = {
  status: string;
  message: string;
  currentVersion: string;
  availableVersion: null | string;
};

type DesktopBridge = {
  getVersion: () => Promise<string>;
  getUpdateState: () => Promise<DesktopUpdateState>;
  checkForUpdates: () => Promise<DesktopUpdateState>;
  downloadAndInstallUpdate: () => Promise<DesktopUpdateState>;
  onUpdateState: (listener: (state: DesktopUpdateState) => void) => () => void;
};

declare global {
  interface Window {
    cptShapeDesktop?: DesktopBridge;
  }
}

export function getDesktopBridge() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.cptShapeDesktop ?? null;
}
