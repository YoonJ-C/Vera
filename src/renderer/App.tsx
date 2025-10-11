import React, { useState, useEffect } from 'react';
import { CompactView } from './components/CompactView';
import { SummaryView } from './components/SummaryView';

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
    };
  }
}

export const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    // Listen for insights from main process
    window.electronAPI.onInsight((data: Insight) => {
      console.log('Received insight:', data);
      setInsights(prev => [...prev, data]);
    });

    // Listen for session end
    window.electronAPI.onSessionEnd((data: SessionData) => {
      console.log('Session ended:', data);
      setSessionData(data);
      setShowSummary(true);
      setIsRecording(false);
    });
  }, []);

  const startSession = async () => {
    try {
      console.log('Starting session...');
      await window.electronAPI.startSession();
      setIsRecording(true);
      setInsights([]);
      setShowSummary(false);
      setSessionData(null);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const stopSession = async () => {
    try {
      console.log('Stopping session...');
      const result = await window.electronAPI.stopSession();
      if (result) {
        setSessionData(result);
        setShowSummary(true);
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  const newSession = async () => {
    setShowSummary(false);
    setInsights([]);
    setSessionData(null);
    await window.electronAPI.resizeToCompact();
    await startSession();
  };

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

