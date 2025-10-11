import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer process
interface InsightData {
  text: string;
  sentiment: string;
  advice: string;
  timestamp: number;
}

interface SessionEndData {
  summary: {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
  };
  transcript: string;
  sessionId: number;
}

contextBridge.exposeInMainWorld('electronAPI', {
  startSession: () => ipcRenderer.invoke('start-session'),
  stopSession: () => ipcRenderer.invoke('stop-session'),
  getHistory: () => ipcRenderer.invoke('get-history'),
  resizeToCompact: () => ipcRenderer.invoke('resize-to-compact'),
  onInsight: (callback: (data: InsightData) => void) => {
    ipcRenderer.on('insight', (_, data) => callback(data));
  },
  onSessionEnd: (callback: (data: SessionEndData) => void) => {
    ipcRenderer.on('session-end', (_, data) => callback(data));
  },
});
