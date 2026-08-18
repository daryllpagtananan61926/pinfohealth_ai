export async function sendChatMessage(sessionId, messages, onDelta) {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw new Error('VITE_API_URL not configured');
  }

  const response = await fetch(`${apiUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, messages }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (data.type === 'crisis' && data.reply) {
      onDelta(data.reply);
      return 'crisis';
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      throw new Error('Unexpected JSON response');
    }
  }

  if (!contentType.includes('text/event-stream')) {
    throw new Error(`Unexpected Content-Type: ${contentType}`);
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

      try {
        const chunk = JSON.parse(payload);
        if (chunk.delta) {
          onDelta(chunk.delta);
        }
      } catch {
        continue;
      }
    }
  }

  return 'normal';
}

export async function sendFeedback(sessionId, helpful) {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw new Error('VITE_API_URL not configured');
  }

  const response = await fetch(`${apiUrl}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, helpful }),
  });

  if (!response.ok) {
    throw new Error(`Feedback request failed with status ${response.status}`);
  }
}

export async function reportSessionStarted(sessionId) {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    return;
  }

  const response = await fetch(`${apiUrl}/api/session-started`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    throw new Error(`Session start request failed with status ${response.status}`);
  }
}