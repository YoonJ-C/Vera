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
let audioBuffer: Buffer[] = [];
let fullTranscript = '';
let chunkCount = 0;

export function registerIpcHandlers(): void {
  ipcMain.handle('start-session', async () => {
    currentSessionId = createSession();
    audioBuffer = [];
    fullTranscript = '';
    chunkCount = 0;
    
    audioService = new AudioCaptureService();
    
    audioService.on('audio-chunk', async (chunk: Buffer) => {
      audioBuffer.push(chunk);
      chunkCount++;
      
      // Process every 10 chunks (~10 seconds of audio for better word boundaries)
      if (chunkCount >= 10) {
        const audioData = Buffer.concat(audioBuffer);
        audioBuffer = [];
        chunkCount = 0;
        
        // Calculate audio duration for validation
        const durationMs = (audioData.length / 2 / 16000) * 1000;
        console.log(`Processing ${durationMs.toFixed(0)}ms of audio (${audioData.length} bytes)`);
        
        // Only process if we have enough audio (minimum 2 seconds)
        if (durationMs >= 2000) {
          const text = await transcribeAudio(audioData);
          
          if (text && text.trim()) {
            fullTranscript += ` ${text}`;
            
            const sentiment = await analyzeSentiment(text);
            const advice = await generateAdvice(text);
            
            if (currentSessionId) {
              addInsight(currentSessionId, text, sentiment.label, advice);
            }
            
            // Send to renderer
            const mainWindow = getMainWindow();
            if (mainWindow) {
              mainWindow.webContents.send('insight', {
                text,
                sentiment: sentiment.label,
                advice,
                timestamp: Date.now(),
              });
            }
          } else {
            console.log('Skipping blank or invalid transcription');
          }
        } else {
          console.log(`Skipping audio chunk too short: ${durationMs.toFixed(0)}ms`);
        }
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
    
    await audioService.startRecording();
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
    audioService.stopRecording();
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

