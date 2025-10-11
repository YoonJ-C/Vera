import { pipeline } from '@xenova/transformers';

interface SentimentResult {
  label: string;
  score: number;
}

interface SentimentPipeline {
  (text: string): Promise<SentimentResult[]>;
}

let sentimentPipeline: SentimentPipeline | null = null;

export async function initializeSentiment(): Promise<void> {
  try {
    console.log('Initializing sentiment analysis model...');
    sentimentPipeline = (await pipeline(
      'sentiment-analysis',
      'Xenova/twitter-roberta-base-sentiment-latest'
    )) as SentimentPipeline;
    console.log('✓ Sentiment analysis initialized');
  } catch (error) {
    console.error('Failed to initialize sentiment analysis:', error);
  }
}

export async function analyzeSentiment(text: string): Promise<{
  label: string;
  score: number;
}> {
  if (!sentimentPipeline) {
    return { label: 'neutral', score: 0.5 };
  }

  try {
    const result = await sentimentPipeline(text);
    const label = result[0].label.toLowerCase();
    const score = result[0].score;
    
    return { label, score };
  } catch (error) {
    console.error('Sentiment analysis failed:', error);
    return { label: 'neutral', score: 0.5 };
  }
}

