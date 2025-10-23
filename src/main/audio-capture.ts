import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';

export class AudioCaptureService extends EventEmitter {
  private isRecording = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private readonly silenceThreshold = 60000; // 60 seconds of no speech
  private lastAudioTime = 0;
  private speechBuffer: Buffer[] = [];
  private lastSpeechTime = 0;
  private readonly pauseThreshold = 2000; // 2 seconds pause = end of sentence

  async startRecording(window: BrowserWindow): Promise<void> {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    this.isRecording = true;
    this.lastAudioTime = Date.now();
    this.speechBuffer = [];
    console.log('✓ Audio recording started (silence-based chunking)');
    
    // Tell renderer to start capturing audio via Web Audio API
    window.webContents.send('start-audio-capture');
  }

  stopRecording(window: BrowserWindow): void {
    if (!this.isRecording) return;
    
    // Process any remaining buffered audio
    if (this.speechBuffer.length > 0) {
      const audioData = Buffer.concat(this.speechBuffer);
      this.emit('audio-chunk', audioData);
      this.speechBuffer = [];
    }
    
    this.isRecording = false;
    this.clearSilenceTimer();
    
    // Tell renderer to stop capturing
    window.webContents.send('stop-audio-capture');
    console.log('✓ Audio recording stopped');
  }

  handleAudioData(chunk: Buffer): void {
    // Check for actual audio activity (not just silence/noise)
    const hasActivity = this.detectAudioActivity(chunk);
    
    if (hasActivity) {
      // Add to speech buffer
      this.speechBuffer.push(chunk);
      this.lastSpeechTime = Date.now();
      this.lastAudioTime = Date.now();
      this.resetSilenceTimer();
    } else {
      // Check if we have a pause (silence after speech)
      const timeSinceLastSpeech = Date.now() - this.lastSpeechTime;
      
      if (timeSinceLastSpeech >= this.pauseThreshold && this.speechBuffer.length > 0) {
        // Natural pause detected - process the accumulated speech
        const audioData = Buffer.concat(this.speechBuffer);
        console.log(`✓ Sentence boundary detected (${timeSinceLastSpeech}ms pause)`);
        this.emit('audio-chunk', audioData);
        this.speechBuffer = [];
      }
    }
  }

  private detectAudioActivity(chunk: Buffer): boolean {
    // Detect actual speech based on amplitude
    const threshold = 1000; // Threshold for speech detection
    let hasActivity = false;
    
    for (let i = 0; i < chunk.length - 1; i += 2) {
      const sample = Math.abs(chunk.readInt16LE(i));
      if (sample > threshold) {
        hasActivity = true;
        break;
      }
    }
    
    return hasActivity;
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      console.log('⏱️ Silence detected (60s of no speech)');
      this.emit('silence-detected');
    }, this.silenceThreshold);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}
