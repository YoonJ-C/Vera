import { pipeline } from '@xenova/transformers';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

interface WhisperPipeline {
  (audio: Float32Array): Promise<{ text?: string }>;
}

let openai: OpenAI | null = null;
let whisperPipeline: WhisperPipeline | null = null;
let isInitializing = false;

export async function initializeTranscription(): Promise<void> {
  if (isInitializing) return;
  isInitializing = true;

  // Initialize OpenAI client
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    openai = new OpenAI({ apiKey });
  }

  // Try to initialize local Whisper (this may take a while on first run)
  try {
    whisperPipeline = (await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en'
    )) as WhisperPipeline;
  } catch (error) {
    // Silent fail, will use API
  }

  isInitializing = false;
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  // Try local Whisper first
  if (whisperPipeline) {
    try {
      // Convert buffer to array for Xenova/transformers
      const audioArray = new Float32Array(audioBuffer.length / 2);
      for (let i = 0; i < audioArray.length; i++) {
        audioArray[i] = audioBuffer.readInt16LE(i * 2) / 32768.0;
      }
      
      const result = await whisperPipeline(audioArray);
      const text = result?.text || '';
      if (text.trim()) {
        return text;
      }
    } catch (error) {
      // Silent fail, will try API
    }
  }

  // Fallback to OpenAI API
  if (openai) {
    try {
      const tempDir = app.getPath('temp');
      const tempFile = path.join(tempDir, `audio-${Date.now()}.wav`);
      fs.writeFileSync(tempFile, audioBuffer);
      
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
      });

      fs.unlinkSync(tempFile);
      return response.text;
    } catch (error) {
      // Silent fail
    }
  }

  return '';
}

