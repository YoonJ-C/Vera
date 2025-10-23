import { pipeline } from '@xenova/transformers';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

interface WhisperPipeline {
  (audio: Float32Array): Promise<{ text?: string }>;
}

// Create proper WAV file header for better audio format
function createWavHeader(dataLength: number): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4); // File size - 8
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // Audio format (PCM)
  header.writeUInt16LE(1, 22); // Number of channels (mono)
  header.writeUInt32LE(16000, 24); // Sample rate
  header.writeUInt32LE(32000, 28); // Byte rate
  header.writeUInt16LE(2, 32); // Block align
  header.writeUInt16LE(16, 34); // Bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
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
  // Validate audio buffer
  if (!audioBuffer || audioBuffer.length < 1000) {
    console.log('Audio buffer too small, skipping transcription');
    return '';
  }

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
        console.log(`✓ Local Whisper: "${text.substring(0, 50)}..."`);
        return text;
      }
    } catch (error) {
      console.log('Local Whisper failed, trying OpenAI API');
    }
  }

  // Fallback to OpenAI API with improved parameters
  if (openai) {
    try {
      const tempDir = app.getPath('temp');
      const tempFile = path.join(tempDir, `audio-${Date.now()}.wav`);
      
      // Create WAV file with proper header
      const wavHeader = createWavHeader(audioBuffer.length);
      const wavBuffer = Buffer.concat([wavHeader, audioBuffer]);
      fs.writeFileSync(tempFile, wavBuffer);
      
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        language: 'en',
        temperature: 0.0,
        prompt: 'This is a business meeting conversation. Participants are discussing projects, deadlines, and action items.',
      });

      fs.unlinkSync(tempFile);
      
      if (response.text && response.text.trim()) {
        console.log(`✓ OpenAI Whisper: "${response.text.substring(0, 50)}..."`);
        return response.text;
      }
    } catch (error) {
      console.error('OpenAI Whisper error:', error);
    }
  }

  console.warn('No transcription service available');
  return '';
}

