import React from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  width: 460px;
  height: 460px;
  background: linear-gradient(180deg,#FFED67 0%,rgb(249, 248, 250) 100%);
  border-radius: 0px;
  padding: 16px;
  color: black;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
`;

const Header = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TranscriptContainer = styled.div`
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

const TranscriptBox = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 100%;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.6;
  text-align: center;
  gap: 24px;
`;

const RecordingIndicator = styled.div`
  font-size: 48px;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  padding-bottom: 8px;
`;

const Button = styled.button`
  padding: 14px 32px;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
  min-width: 180px;
  
  &:hover {
    background: #dc2626;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const StartButton = styled(Button)`
  background:rgb(8, 137, 94);
  
  &:hover {
    background:rgb(5, 103, 72);
  }
`;

interface Props {
  liveTranscript: string;
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const CompactView: React.FC<Props> = ({ liveTranscript, isRecording, onStart, onStop }) => {
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
            <span>Transcript</span>
          </>
        )}
      </Header>
      
      <TranscriptContainer>
        {!liveTranscript && !isRecording ? (
          <EmptyState>
            <div>Click Start to begin recording</div>
            <StartButton onClick={onStart}>Start Recording</StartButton>
          </EmptyState>
        ) : !liveTranscript && isRecording ? (
          <EmptyState>
            <RecordingIndicator>🎙️</RecordingIndicator>
            <div>Listening...</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Speak now to see live transcript
            </div>
          </EmptyState>
        ) : (
          <TranscriptBox>{liveTranscript}</TranscriptBox>
        )}
      </TranscriptContainer>
      
      {(liveTranscript || isRecording) && (
        <ButtonContainer>
          {isRecording ? (
            <Button onClick={onStop}>Stop Session</Button>
          ) : (
            <StartButton onClick={onStart}>Start Recording</StartButton>
          )}
        </ButtonContainer>
      )}
    </Container>
  );
};
