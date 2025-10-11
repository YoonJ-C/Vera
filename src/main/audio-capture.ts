import { EventEmitter } from 'events';

// Note: node-audiorecorder requires sox/rec to be installed on the system
// macOS: brew install sox
// Windows: Install from https://sourceforge.net/projects/sox/
// Linux: sudo apt-get install sox

interface AudioRecorderInstance {
  start: () => { stream: () => NodeJS.ReadableStream };
  stop: () => void;
}

export class AudioCaptureService extends EventEmitter {
  private recorder: AudioRecorderInstance | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  private readonly silenceThreshold = 30000; // 30 seconds
  private isRecording = false;

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      // Dynamically import to avoid errors if sox is not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AudioRecorder = require('node-audiorecorder');
      
      this.recorder = new AudioRecorder({
        program: process.platform === 'win32' ? 'sox' : 'rec',
        device: null,
        bits: 16,
        channels: 1,
        encoding: 'signed-integer',
        rate: 16000,
        type: 'wav',
        silence: 0,
      }, console) as AudioRecorderInstance;

      const audioStream = this.recorder.start().stream();
      this.isRecording = true;
      
      audioStream.on('data', (chunk: Buffer) => {
        this.resetSilenceTimer();
        this.emit('audio-chunk', chunk);
      });

      audioStream.on('error', (err: Error) => {
        console.error('Audio stream error:', err);
        this.emit('error', err);
      });

      console.log('✓ Audio recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('error', error);
    }
  }

  stopRecording(): void {
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    this.clearSilenceTimer();
    this.isRecording = false;
    console.log('✓ Audio recording stopped');
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      console.log('⏱️ Silence detected (30s)');
      this.emit('silence-detected');
      this.stopRecording();
    }, this.silenceThreshold);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

