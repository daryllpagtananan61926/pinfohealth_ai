import config from '../../config.js';
import { validateUIComponent, ALLOWED_UI_COMPONENTS } from './ui-schemas.js';

export const MAX_HISTORY_MESSAGES = 6;
export const MAX_UI_PER_SESSION = 10;

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const SYSTEM_PROMPT = config.systemPrompt;

// UI marker pattern: [[UI:component-name:{"prop":"value"}]]
const UI_MARKER_REGEX = /\[\[UI:([a-z0-9-]+):(\{.*?\})\]\]/g;

// Session UI component counter (in-memory, per-process)
const sessionUiCounts = new Map();

function incrementUiCount(sessionId) {
  const count = (sessionUiCounts.get(sessionId) || 0) + 1;
  sessionUiCounts.set(sessionId, count);
  return count;
}

export function resetUiCount(sessionId) {
  sessionUiCounts.delete(sessionId);
}

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

export function truncateMessages(messages) {
  return messages.slice(-MAX_HISTORY_MESSAGES);
}

export function parseUIMarkers(text, sessionId) {
  const markers = [];
  let match;
  while ((match = UI_MARKER_REGEX.exec(text)) !== null) {
    const component = match[1];
    const propsJson = match[2];
    if (!ALLOWED_UI_COMPONENTS.has(component)) {
      continue;
    }
    let props;
    try {
      props = JSON.parse(propsJson);
    } catch {
      continue;
    }
    const validation = validateUIComponent(component, props);
    if (!validation.valid) {
      continue;
    }
    if (sessionId) {
      const count = incrementUiCount(sessionId);
      if (count > MAX_UI_PER_SESSION) {
        continue;
      }
    }
    markers.push({ component, props });
  }
  return markers;
}

function stripUIMarkers(text) {
  return text.replace(UI_MARKER_REGEX, '').trim();
}

async function* streamGeminiDeltas(messages, sessionId) {
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
    let accumulatedText = '';

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
            accumulatedText += part.text;
            
            // Check for complete UI markers in accumulated text
            const markers = parseUIMarkers(accumulatedText, sessionId);
            if (markers.length > 0) {
              // Yield text before the first marker
              const firstMarkerIndex = accumulatedText.indexOf('[[UI:');
              if (firstMarkerIndex > 0) {
                const textBeforeMarker = accumulatedText.slice(0, firstMarkerIndex);
                if (textBeforeMarker.trim()) {
                  yield { type: 'text', delta: textBeforeMarker };
                }
              }
              // Yield UI components (max 1 per message for safety)
              for (const marker of markers.slice(0, 1)) {
                yield { type: 'ui', component: marker.component, props: marker.props };
              }
              // Reset accumulated text to content after the last processed marker
              const lastMarkerMatch = [...accumulatedText.matchAll(UI_MARKER_REGEX)].pop();
              if (lastMarkerMatch) {
                accumulatedText = accumulatedText.slice(lastMarkerMatch.index + lastMarkerMatch[0].length);
              } else {
                accumulatedText = '';
              }
            } else {
              // No complete marker yet, yield text delta and clear accumulator
              yield { type: 'text', delta: part.text };
              accumulatedText = '';
            }
          }
        }
      }
    }

    // Flush any remaining text
    const remainingText = stripUIMarkers(accumulatedText);
    if (remainingText.trim()) {
      yield { type: 'text', delta: remainingText };
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export { streamGeminiDeltas };