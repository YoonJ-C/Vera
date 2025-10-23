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
  onTranscriptUpdate: (callback: (data: { text: string; fullTranscript: string; timestamp: number }) => void) => {
    ipcRenderer.on('transcript-update', (_, data) => callback(data));
  },
  onSessionEnd: (callback: (data: SessionEndData) => void) => {
    ipcRenderer.on('session-end', (_, data) => callback(data));
  },
  // Audio capture (Web Audio API)
  onStartAudioCapture: (callback: () => void) => {
    ipcRenderer.on('start-audio-capture', callback);
  },
  onStopAudioCapture: (callback: () => void) => {
    ipcRenderer.on('stop-audio-capture', callback);
  },
  sendAudioChunk: (audioData: number[]) => ipcRenderer.invoke('send-audio-chunk', audioData),
  // Auth methods
  signUp: (email: string, password: string) => ipcRenderer.invoke('auth-sign-up', email, password),
  signIn: (email: string, password: string) => ipcRenderer.invoke('auth-sign-in', email, password),
  signOut: () => ipcRenderer.invoke('auth-sign-out'),
  checkAuthState: () => ipcRenderer.invoke('auth-check-state'),
});
