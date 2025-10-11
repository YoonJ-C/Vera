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
    console.log('✓ OpenAI client initialized');
  } else {
    console.warn('⚠️ OPENAI_API_KEY not set, API fallback disabled');
  }

  // Try to initialize local Whisper (this may take a while on first run)
  try {
    console.log('Initializing local Whisper model...');
    whisperPipeline = (await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en'
    )) as WhisperPipeline;
    console.log('✓ Local Whisper initialized');
  } catch (error) {
    console.warn('⚠️ Local Whisper failed to initialize:', error);
    console.log('Will use OpenAI API for transcription');
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
        console.log('✓ Local transcription:', text.substring(0, 50) + '...');
        return text;
      }
    } catch (error) {
      console.warn('Local transcription failed:', error);
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
      console.log('✓ API transcription:', response.text.substring(0, 50) + '...');
      return response.text;
    } catch (error) {
      console.error('API transcription failed:', error);
    }
  }

  return '';
}

