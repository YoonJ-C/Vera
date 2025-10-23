import { ipcMain } from 'electron';
import { createHash } from 'crypto';
import { AudioCaptureService } from './audio-capture';
import { transcribeAudio } from './transcription';
import { analyzeSentiment } from './sentiment';
import { generateAdvice, generateSummary } from './gpt-advice';
import { createSession, addInsight, endSession, getSessions, createUser, loginUser, getAuthState, clearAuthState } from './database';
import { resizeToSummary, resizeToCompact, getMainWindow } from './window';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

let currentSessionId: number | null = null;
let audioService: AudioCaptureService | null = null;
let fullTranscript = '';

export function registerIpcHandlers(): void {
  ipcMain.handle('start-session', async () => {
    currentSessionId = createSession();
    fullTranscript = '';
    
    audioService = new AudioCaptureService();
    
    // Process audio chunks as they come (silence-based)
    audioService.on('audio-chunk', async (audioData: Buffer) => {
      const durationMs = (audioData.length / 2 / 16000) * 1000;
      console.log(`Processing ${durationMs.toFixed(0)}ms of audio (${audioData.length} bytes)`);
      
      // Only process if we have enough audio (minimum 1 second)
      if (durationMs >= 1000) {
        const text = await transcribeAudio(audioData);
        
        if (text && text.trim()) {
          fullTranscript += ` ${text}`;
          console.log(`✓ Captured: "${text.substring(0, 60)}..."`);
          
          // Send live transcript to renderer
          const mainWindow = getMainWindow();
          if (mainWindow) {
            mainWindow.webContents.send('transcript-update', {
              text,
              fullTranscript,
              timestamp: Date.now(),
            });
          }
        } else {
          console.log('Skipping blank or invalid transcription');
        }
      } else {
        console.log(`Skipping audio chunk too short: ${durationMs.toFixed(0)}ms`);
      }
    });
    
    audioService.on('silence-detected', async () => {
      const result = await handleSessionEnd();
      const mainWindow = getMainWindow();
      if (mainWindow && result) {
        mainWindow.webContents.send('session-end', result);
      }
    });
    
    audioService.on('error', () => {
      // Silent error handling
    });
    
    const mainWindow = getMainWindow();
    if (mainWindow) {
      await audioService.startRecording(mainWindow);
    }
    return { sessionId: currentSessionId };
  });

  ipcMain.handle('stop-session', async () => {
    return await handleSessionEnd();
  });

  ipcMain.handle('get-history', async () => {
    return getSessions();
  });

  ipcMain.handle('resize-to-compact', () => {
    resizeToCompact();
  });

  // Handle audio data from renderer (Web Audio API)
  ipcMain.handle('send-audio-chunk', async (_, audioData: number[]) => {
    if (audioService) {
      const buffer = Buffer.from(new Int16Array(audioData).buffer);
      audioService.handleAudioData(buffer);
    }
  });

  // Simple local auth handlers
  ipcMain.handle('auth-sign-up', async (_, email: string, password: string) => {
    try {
      const passwordHash = hashPassword(password);
      createUser(email, passwordHash);
      return { success: true };
    } catch (error: any) {
      throw new Error('Email already exists');
    }
  });

  ipcMain.handle('auth-sign-in', async (_, email: string, password: string) => {
    const passwordHash = hashPassword(password);
    const success = loginUser(email, passwordHash);
    if (!success) {
      throw new Error('Invalid email or password');
    }
    return { success: true };
  });

  ipcMain.handle('auth-sign-out', async () => {
    clearAuthState();
    return { success: true };
  });

  ipcMain.handle('auth-check-state', async () => {
    const authState = getAuthState();
    if (authState) {
      return { authenticated: true, email: authState.email };
    }
    return { authenticated: false };
  });
}

async function handleSessionEnd(): Promise<{
  summary: { summary: string; keyPoints: string[]; actionItems: string[] };
  transcript: string;
  sessionId: number;
} | null> {
  if (audioService) {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      audioService.stopRecording(mainWindow);
    }
    audioService.removeAllListeners();
    audioService = null;
  }

  if (currentSessionId && fullTranscript.trim()) {
    const summary = await generateSummary(fullTranscript);
    endSession(currentSessionId, fullTranscript, summary);
    
    resizeToSummary();
    
    return { 
      summary, 
      transcript: fullTranscript,
      sessionId: currentSessionId,
    };
  }

  return null;
}

