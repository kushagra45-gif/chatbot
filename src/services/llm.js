/**
 * LLM Service Module
 * Handles all AI interactions with streaming support.
 * Provider: Groq API (High-speed LPU inference, OpenAI-compatible endpoint).
 */

export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful, accurate, friendly AI assistant. Answer any topic clearly and concisely. Use markdown, code blocks, lists and tables where useful. Reply in the same language the user writes in (including Hindi, Hinglish and English). If unsure, say so instead of guessing.";

export const AVAILABLE_MODELS = [
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B (Recommended)',
    provider: 'groq',
    description: 'Instant response, multimodal text+vision, smart & multilingual',
  },
  {
    id: 'groq/compound',
    name: 'Groq Compound',
    provider: 'groq',
    description: 'Groq flagship multi-model compound reasoning system',
  },
  {
    id: 'groq/compound-mini',
    name: 'Groq Compound Mini',
    provider: 'groq',
    description: 'Ultra-fast compound model for quick answers',
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'OpenAI GPT OSS 120B',
    provider: 'groq',
    description: '120B parameter deep reasoning open model',
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT OSS 20B',
    provider: 'groq',
    description: '20B parameter efficient reasoning model',
  },
];

export const DEFAULT_MODEL =
  import.meta.env.VITE_GROQ_MODEL || 'qwen/qwen3.8-27b';

/**
 * Helper to get active API key (from parameter override or Vite environment)
 */
export function getApiKey(providedKey) {
  return providedKey?.trim() || import.meta.env.VITE_API_KEY?.trim() || '';
}

/**
 * Trims message history to prevent exceeding context limits.
 */
export function trimMessageHistory(messages, maxMessages = 24) {
  if (!messages || messages.length <= maxMessages) {
    return messages || [];
  }

  let sliced = messages.slice(-maxMessages);
  while (sliced.length > 0 && sliced[0].role !== 'user') {
    sliced = sliced.slice(1);
  }

  return sliced.length > 0 ? sliced : messages.slice(-1);
}

/**
 * Converts internal message format to Groq/OpenAI compatible payload
 */
function formatGroqMessages(messages, systemPrompt) {
  const formatted = [];

  if (systemPrompt) {
    formatted.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'assistant' : 'user';

    // If message includes an image and is from user
    if (msg.image && role === 'user') {
      formatted.push({
        role,
        content: [
          { type: 'text', text: msg.content || 'Analyze this image.' },
          {
            type: 'image_url',
            image_url: {
              url: msg.image,
            },
          },
        ],
      });
    } else {
      formatted.push({
        role,
        content: msg.content || '',
      });
    }
  }

  return formatted;
}

/**
 * Groq Streaming Provider via Server-Sent Events (SSE)
 */
async function streamGroq({
  messages,
  apiKey,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  signal,
  onChunk,
}) {
  const activeKey = getApiKey(apiKey);

  if (!activeKey) {
    throw new Error(
      'Groq API Key is missing. Please enter your free Groq API key in the Settings dialog (top right) or check VITE_API_KEY in your .env file.'
    );
  }

  const trimmedMessages = trimMessageHistory(messages);
  const formattedMessages = formatGroqMessages(trimmedMessages, systemPrompt);

  if (formattedMessages.length === 0) {
    throw new Error('No valid messages to send.');
  }

  // Fallback to DEFAULT_MODEL if an unsupported/obsolete model ID was passed
  const activeModel = AVAILABLE_MODELS.some((m) => m.id === model)
    ? model
    : DEFAULT_MODEL;

  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const payload = {
    model: activeModel,
    messages: formattedMessages,
    temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
    stream: true,
  };

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new Error(
      `Network connection failed while reaching Groq (${url}). Please check your internet connection. (${err.message})`
    );
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || '';
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Invalid Groq API Key. Please verify your free Groq API key in Settings (get free key at https://console.groq.com/keys).'
      );
    } else if (response.status === 429) {
      throw new Error(
        'Groq rate limit reached. Please wait a few seconds before trying again.'
      );
    } else if (response.status === 404) {
      throw new Error(
        `Groq model '${activeModel}' is not available. Please select 'Qwen 3.8 27B' or 'Groq Compound' in Settings.`
      );
    }

    throw new Error(
      `Groq API error (${response.status}): ${errorDetail || 'Unknown error'}`
    );
  }

  if (!response.body) {
    throw new Error('Readable stream not supported in this browser environment.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const data = JSON.parse(jsonStr);
          const delta = data.choices?.[0]?.delta;
          // Capture content or reasoning tokens (for reasoning models)
          const textChunk = delta?.content || delta?.reasoning || '';
          if (textChunk) {
            fullText += textChunk;
            if (onChunk) onChunk(textChunk, fullText);
          }
        } catch {
          // Ignore incomplete chunk
        }
      }
    }

    if (!fullText.trim()) {
      throw new Error('Received an empty response from Groq AI. Please try sending your message again.');
    }

    return fullText;
  } catch (err) {
    if (err.name === 'AbortError') {
      return fullText;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Main Swappable LLM Completion Interface
 */
export async function streamChatCompletion({
  messages,
  apiKey,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  signal,
  onChunk,
}) {
  return streamGroq({
    messages,
    apiKey,
    model,
    temperature,
    systemPrompt,
    signal,
    onChunk,
  });
}
