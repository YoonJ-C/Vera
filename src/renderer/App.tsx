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
      onInsight: (callback: (data: Insight) => void) => void;
      onSessionEnd: (callback: (data: SessionData) => void) => void;
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
  const [insights, setInsights] = useState<Insight[]>([]);
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

    // Listen for insights from main process
    window.electronAPI.onInsight((data: Insight) => {
      setInsights(prev => [...prev, data]);
    });

    // Listen for session end
    window.electronAPI.onSessionEnd((data: SessionData) => {
      setSessionData(data);
      setShowSummary(true);
      setIsRecording(false);
    });
  }, []);

  const startSession = async () => {
    try {
      await window.electronAPI.startSession();
      setIsRecording(true);
      setInsights([]);
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
    setInsights([]);
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
      insights={insights}
      isRecording={isRecording}
      onStart={startSession}
      onStop={stopSession}
    />
  );
};

