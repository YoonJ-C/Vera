import { app, BrowserWindow } from 'electron';
import * as dotenv from 'dotenv';
import { createWindow } from './main/window';
import { initializeDatabase } from './main/database';
import { initializeTranscription } from './main/transcription';
import { initializeSentiment } from './main/sentiment';
import { initializeGPT } from './main/gpt-advice';
import { registerIpcHandlers } from './main/ipc-handlers';

// Load environment variables
dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize services when app is ready
app.on('ready', async () => {
  // Initialize database
  initializeDatabase();
  
  // Initialize AI services (async, non-blocking)
  initializeGPT();
  initializeTranscription().catch(() => {});
  initializeSentiment().catch(() => {});
  
  // Register IPC handlers
  registerIpcHandlers();
  
  // Create window
  createWindow();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
