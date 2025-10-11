import { ipcMain } from 'electron';
import { AudioCaptureService } from './audio-capture';
import { transcribeAudio } from './transcription';
import { analyzeSentiment } from './sentiment';
import { generateAdvice, generateSummary } from './gpt-advice';
import { createSession, addInsight, endSession, getSessions } from './database';
import { resizeToSummary, resizeToCompact, getMainWindow } from './window';

let currentSessionId: number | null = null;
let audioService: AudioCaptureService | null = null;
let audioBuffer: Buffer[] = [];
let fullTranscript = '';
let chunkCount = 0;

export function registerIpcHandlers(): void {
  ipcMain.handle('start-session', async () => {
    console.log('📝 Starting new session...');
    currentSessionId = createSession();
    audioBuffer = [];
    fullTranscript = '';
    chunkCount = 0;
    
    audioService = new AudioCaptureService();
    
    audioService.on('audio-chunk', async (chunk: Buffer) => {
      audioBuffer.push(chunk);
      chunkCount++;
      
      // Process every 5 chunks (~5 seconds of audio at 1 chunk/sec)
      if (chunkCount >= 5) {
        const audioData = Buffer.concat(audioBuffer);
        audioBuffer = [];
        chunkCount = 0;
        
        console.log('🎤 Processing audio chunk...');
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
        }
      }
    });
    
    audioService.on('silence-detected', async () => {
      console.log('🔇 Silence detected, ending session...');
      const result = await handleSessionEnd();
      const mainWindow = getMainWindow();
      if (mainWindow && result) {
        mainWindow.webContents.send('session-end', result);
      }
    });
    
    audioService.on('error', (error) => {
      console.error('Audio service error:', error);
    });
    
    await audioService.startRecording();
    return { sessionId: currentSessionId };
  });

  ipcMain.handle('stop-session', async () => {
    console.log('⏹️ Stopping session...');
    return await handleSessionEnd();
  });

  ipcMain.handle('get-history', async () => {
    return getSessions();
  });

  ipcMain.handle('resize-to-compact', () => {
    resizeToCompact();
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
    console.log('📊 Generating summary...');
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

