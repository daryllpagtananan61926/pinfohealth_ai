import config from '../../config.js';
import { SYSTEM_PROMPT } from './prompts.js';

export const MAX_HISTORY_MESSAGES = 6;

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

export function truncateMessages(messages) {
  return messages.slice(-MAX_HISTORY_MESSAGES);
}

async function* streamGeminiDeltas(messages) {
  const url = `${GEMINI_ENDPOINT}/${config.geminiModel}:streamGenerateContent?alt=sse`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiApiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: toGeminiContents(truncateMessages(messages)),
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        errorBody = '<could not read response body>';
      }
      console.error(`Gemini request failed with status ${response.status}:`, errorBody);
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.startsWith('data:')) continue;

        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;

        let chunk;
        try {
          chunk = JSON.parse(payload);
        } catch {
          continue;
        }

        const parts = chunk?.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.text && !part.thought) {
            yield part.text;
          }
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export { streamGeminiDeltas };