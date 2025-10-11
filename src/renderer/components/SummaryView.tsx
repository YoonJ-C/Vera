import React from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg,#FFED67 0%,rgb(249, 248, 250) 100%);
  color: black;
  padding: 40px;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #374151;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 4px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 24px;
  font-weight: 700;
`;

const Section = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  margin-bottom: 12px;
  color:rgb(42, 42, 42);
  font-weight: 600;
`;

const SummaryText = styled.p`
  line-height: 1.6;
  color:rgb(42, 42, 42);
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  padding: 12px;
  margin-bottom: 8px;
  background:rgb(255, 255, 255);
  border-radius: 8px;
  line-height: 1.5;
  
  &:before {
    content: '•';
    color: #10b981;
    font-weight: bold;
    display: inline-block;
    width: 1em;
    margin-left: -1em;
    margin-right: 8px;
  }
`;

const TranscriptBox = styled.div`
  background: #374151;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  color: #d1d5db;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 32px;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: #667eea;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: #5568d3;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const SecondaryButton = styled(Button)`
  background: #6b7280;
  
  &:hover {
    background: #4b5563;
  }
`;

interface Props {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  transcript: string;
  onNewSession: () => void;
}

export const SummaryView: React.FC<Props> = ({
  summary,
  keyPoints,
  actionItems,
  transcript,
  onNewSession,
}) => {
  return (
    <Container>
      <Title>📊 Session Summary</Title>
      
      <Section>
        <SectionTitle>Summary</SectionTitle>
        <SummaryText>{summary}</SummaryText>
      </Section>

      {keyPoints.length > 0 && (
        <Section>
          <SectionTitle>Key Points</SectionTitle>
          <List>
            {keyPoints.map((point, idx) => (
              <ListItem key={idx}>{point}</ListItem>
            ))}
          </List>
        </Section>
      )}

      {actionItems.length > 0 && (
        <Section>
          <SectionTitle>Action Items</SectionTitle>
          <List>
            {actionItems.map((item, idx) => (
              <ListItem key={idx}>{item}</ListItem>
            ))}
          </List>
        </Section>
      )}

      <Section>
        <SectionTitle>Full Transcript</SectionTitle>
        <TranscriptBox>{transcript}</TranscriptBox>
      </Section>

      <ButtonGroup>
        <Button onClick={onNewSession}>Start New Session</Button>
        <SecondaryButton onClick={() => {
          if (window.electronAPI?.resizeToCompact) {
            window.electronAPI.resizeToCompact();
          }
        }}>
          Back to Compact View
        </SecondaryButton>
      </ButtonGroup>
    </Container>
  );
};

