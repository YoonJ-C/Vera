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

// Audio validation - check if audio contains actual speech
function hasActualSpeech(audioBuffer: Buffer): boolean {
  const samples = new Int16Array(audioBuffer.length / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = audioBuffer.readInt16LE(i * 2);
  }
  
  // Check if audio has sufficient energy
  let energySum = 0;
  for (let i = 0; i < samples.length; i++) {
    energySum += Math.abs(samples[i]);
  }
  const averageEnergy = energySum / samples.length;
  
  // If average energy is too low, it's likely silence/noise
  const MIN_SPEECH_ENERGY = 500; // Threshold for actual speech
  return averageEnergy > MIN_SPEECH_ENERGY;
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  // Validate audio buffer
  if (!audioBuffer || audioBuffer.length < 2000) {
    console.log('Audio buffer too small, skipping transcription');
    return '';
  }

  // Check if audio contains actual speech (not just noise)
  if (!hasActualSpeech(audioBuffer)) {
    console.log('No speech detected in audio, skipping transcription');
    return '';
  }
  
  // Skip local Whisper - go straight to OpenAI for best accuracy
  if (openai) {
    try {
      const tempDir = app.getPath('temp');
      const tempFile = path.join(tempDir, `audio-${Date.now()}.wav`);
      
      // Create WAV file with proper header (use original buffer, not preprocessed)
      const wavHeader = createWavHeader(audioBuffer.length);
      const wavBuffer = Buffer.concat([wavHeader, audioBuffer]);
      fs.writeFileSync(tempFile, wavBuffer);
      
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        language: 'en',
        temperature: 0.0,
        prompt: 'This is a professional business meeting conversation. Participants are discussing projects, deadlines, action items, and business strategy. Use proper punctuation and capitalization.',
        response_format: 'verbose_json',
      });

      fs.unlinkSync(tempFile);
      
      if (response.text && response.text.trim()) {
        console.log(`✓ OpenAI Whisper: "${response.text.substring(0, 60)}..."`);
        return response.text;
      }
    } catch (error) {
      console.error('OpenAI Whisper error:', error);
    }
  }

  console.warn('No transcription service available');
  return '';
}

