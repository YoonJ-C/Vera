import OpenAI from 'openai';

let openai: OpenAI | null = null;

export function initializeGPT(): void {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    openai = new OpenAI({ apiKey });
  }
}

export async function generateAdvice(transcript: string): Promise<string> {
  if (!openai) {
    return 'GPT service not available';
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant providing brief, actionable advice based on conversation transcripts. Keep responses under 50 words.',
        },
        {
          role: 'user',
          content: `Provide brief advice based on this transcript: ${transcript}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'No advice generated.';
  } catch (error) {
    return 'Unable to generate advice';
  }
}

export async function generateSummary(fullTranscript: string): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}> {
  if (!openai) {
    return {
      summary: 'GPT service not available',
      keyPoints: [],
      actionItems: [],
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Summarize meetings with key points and action items in JSON format: {"summary": "...", "keyPoints": [...], "actionItems": [...]}',
        },
        {
          role: 'user',
          content: fullTranscript,
        },
      ],
      max_tokens: 500,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      summary: result.summary || 'No summary available',
      keyPoints: result.keyPoints || [],
      actionItems: result.actionItems || [],
    };
  } catch (error) {
    return {
      summary: 'Unable to generate summary',
      keyPoints: [],
      actionItems: [],
    };
  }
}

