import { BrowserWindow, screen } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;

export function createWindow(): BrowserWindow {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: 460,
    height: 460,
    x: width - 480,
    y: 20,
    alwaysOnTop: true,
    frame: true, // Show frame for now to make it easier to see
    transparent: false, // Disable transparency for visibility
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  
  return mainWindow;
}

export function resizeToSummary(): void {
  if (!mainWindow) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setSize(Math.floor(width / 2), height);
  mainWindow.center();
}

export function resizeToCompact(): void {
  if (!mainWindow) return;
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setSize(460, 460);
  mainWindow.setPosition(width - 480, 20);
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

