import React, { useState, useEffect } from 'react';
import { CompactView } from './components/CompactView';
import { SummaryView } from './components/SummaryView';
import { LoginScreen } from './components/LoginScreen';

interface Insight {
  text: string;
  sentiment: string;
  advice: string;
  timestamp: number;
}

interface SessionData {
  summary: {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
  };
  transcript: string;
  sessionId: number;
}

interface HistorySession {
  id: number;
  start_time: number;
  end_time: number | null;
  transcript: string | null;
  summary: string | null;
  key_points: string | null;
  action_items: string | null;
}

declare global {
  interface Window {
    electronAPI: {
      startSession: () => Promise<{ sessionId: number }>;
      stopSession: () => Promise<SessionData>;
      getHistory: () => Promise<HistorySession[]>;
      resizeToCompact: () => Promise<void>;
      onTranscriptUpdate: (callback: (data: { text: string; fullTranscript: string; timestamp: number }) => void) => void;
      onSessionEnd: (callback: (data: SessionData) => void) => void;
      onStartAudioCapture: (callback: () => void) => void;
      onStopAudioCapture: (callback: () => void) => void;
      sendAudioChunk: (audioData: number[]) => Promise<void>;
      signUp: (email: string, password: string) => Promise<{ success: boolean }>;
      signIn: (email: string, password: string) => Promise<{ success: boolean }>;
      signOut: () => Promise<{ success: boolean }>;
      checkAuthState: () => Promise<{ authenticated: boolean }>;
    };
  }
}

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    // Check auth state on mount
    const checkAuth = async () => {
      try {
        if (!window.electronAPI) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        const result = await window.electronAPI.checkAuthState();
        setIsAuthenticated(result.authenticated);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for live transcript updates
    window.electronAPI.onTranscriptUpdate((data: { text: string; fullTranscript: string; timestamp: number }) => {
      setLiveTranscript(data.fullTranscript);
    });

    // Listen for session end
    window.electronAPI.onSessionEnd((data: SessionData) => {
      setSessionData(data);
      setShowSummary(true);
      setIsRecording(false);
    });

    // Setup Web Audio API for high-quality audio capture
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let processor: ScriptProcessorNode | null = null;

    window.electronAPI.onStartAudioCapture(async () => {
      try {
        // Request high-quality microphone access
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            latency: 0.01, // Low latency
          } 
        });
        
        audioContext = new AudioContext({ 
          sampleRate: 16000,
          latencyHint: 'interactive'
        });
        
        const source = audioContext.createMediaStreamSource(mediaStream);
        processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const int16Data = new Int16Array(inputData.length);
          
          // Convert float32 [-1, 1] to int16 [-32768, 32767] with normalization
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16Data[i] = s < 0 ? s * 32768 : s * 32767;
          }
          
          // Send audio data to main process
          window.electronAPI.sendAudioChunk(Array.from(int16Data));
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        console.log('✓ Web Audio capture started with noise suppression');
      } catch (error) {
        console.error('Failed to start audio capture:', error);
      }
    });

    window.electronAPI.onStopAudioCapture(() => {
      if (processor) {
        processor.disconnect();
        processor = null;
      }
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
      }
      console.log('✓ Web Audio capture stopped');
    });
  }, []);

  const startSession = async () => {
    try {
      await window.electronAPI.startSession();
      setIsRecording(true);
      setLiveTranscript('');
      setShowSummary(false);
      setSessionData(null);
    } catch (error) {
      // Silent fail
    }
  };

  const stopSession = async () => {
    try {
      const result = await window.electronAPI.stopSession();
      if (result) {
        setSessionData(result);
        setShowSummary(true);
      }
      setIsRecording(false);
    } catch (error) {
      // Silent fail
    }
  };

  const newSession = async () => {
    setShowSummary(false);
    setLiveTranscript('');
    setSessionData(null);
    await window.electronAPI.resizeToCompact();
    await startSession();
  };

  const handleLogin = async (email: string, password: string) => {
    await window.electronAPI.signIn(email, password);
    setIsAuthenticated(true);
  };

  const handleSignUp = async (email: string, password: string) => {
    await window.electronAPI.signUp(email, password);
    setIsAuthenticated(true);
  };

  const handleGoogleSignIn = async () => {
    throw new Error('Google Sign-In not available');
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f0f0f0' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        onGoogleSignIn={handleGoogleSignIn}
      />
    );
  }

  if (showSummary && sessionData) {
    return (
      <SummaryView
        summary={sessionData.summary.summary}
        keyPoints={sessionData.summary.keyPoints}
        actionItems={sessionData.summary.actionItems}
        transcript={sessionData.transcript}
        onNewSession={newSession}
      />
    );
  }

  return (
    <CompactView
      liveTranscript={liveTranscript}
      isRecording={isRecording}
      onStart={startSession}
      onStop={stopSession}
    />
  );
};

