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
    sentimentPipeline = (await pipeline(
      'sentiment-analysis',
      'Xenova/twitter-roberta-base-sentiment-latest'
    )) as SentimentPipeline;
  } catch (error) {
    // Silent fail
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
    return { label: 'neutral', score: 0.5 };
  }
}

