import React from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  width: 460px;
  height: 460px;
  background: linear-gradient(180deg,#FFED67 0%,rgb(249, 248, 250) 100%);
  border-radius: 0px;
  padding: 20px;
  color: black;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Header = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InsightsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
`;

const InsightCard = styled.div<{ sentiment: string }>`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border-left: 4px solid ${props => 
    props.sentiment === 'positive' ? '#10b981' :
    props.sentiment === 'negative' ? '#ef4444' : '#6b7280'
  };
  animation: slideIn 0.3s ease;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const TranscriptText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
  line-height: 1.4;
`;

const AdviceText = styled.div`
  font-size: 14px;
  opacity: 0.9;
  font-style: italic;
`;

const Button = styled.button`
  padding: 12px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: #dc2626;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const StartButton = styled(Button)`
  background: #10b981;
  
  &:hover {
    background: #059669;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.6;
  text-align: center;
`;

interface Insight {
  text: string;
  sentiment: string;
  advice: string;
  timestamp: number;
}

interface Props {
  insights: Insight[];
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const CompactView: React.FC<Props> = ({ insights, isRecording, onStart, onStop }) => {
  return (
    <Container>
      <Header>
        {isRecording ? (
          <>
            <span>🎙️</span>
            <span>Recording...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Insights</span>
          </>
        )}
      </Header>
      
      <InsightsContainer>
        {insights.length === 0 ? (
          <EmptyState>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎤</div>
            <div>Click Start to begin recording</div>
          </EmptyState>
        ) : (
          insights.slice(-3).map((insight, idx) => (
            <InsightCard key={idx} sentiment={insight.sentiment}>
              <TranscriptText>{insight.text}</TranscriptText>
              <AdviceText>💡 {insight.advice}</AdviceText>
            </InsightCard>
          ))
        )}
      </InsightsContainer>
      
      {isRecording ? (
        <Button onClick={onStop}>Stop Session</Button>
      ) : (
        <StartButton onClick={onStart}>Start Recording</StartButton>
      )}
    </Container>
  );
};

