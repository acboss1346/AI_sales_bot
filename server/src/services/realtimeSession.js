import { buildSalesSystemPrompt } from '../utils/productConfig.js';

export async function createRealtimeSession() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()?.replace(/^['"]|['"]$/g, '');

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    const error = new Error('OpenAI API key is missing. Please set OPENAI_API_KEY in your server environment or .env file.');
    error.statusCode = 400;
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  // Map any obsolete preview model name to official GA realtime models
  let model = process.env.OPENAI_REALTIME_MODEL?.trim()?.replace(/^['"]|['"]$/g, '');
  if (!model || model.includes('preview')) {
    model = 'gpt-realtime-mini';
  }

  const voice = process.env.OPENAI_VOICE?.trim()?.replace(/^['"]|['"]$/g, '') || 'alloy';
  const instructions = buildSalesSystemPrompt();

  // Official OpenAI Realtime GA client_secrets schema
  const sessionConfig = {
    session: {
      type: 'realtime',
      model,
      instructions,
      audio: {
        input: {
          transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        },
        output: {
          voice
        }
      }
    }
  };

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionConfig)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI Realtime API error response:', data);
      const error = new Error(data?.error?.message || `OpenAI Realtime session error (${response.status})`);
      error.statusCode = response.status;
      error.details = data;
      throw error;
    }

    const secretValue = data.value || data.client_secret?.value;
    if (!secretValue) {
      throw new Error('OpenAI response did not include client secret value.');
    }

    return {
      client_secret: {
        value: secretValue,
        expires_at: data.expires_at || null
      },
      value: secretValue,
      sessionId: data.session?.id || data.id,
      model: data.session?.model || model,
      voice
    };
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 502;
    }
    throw err;
  }
}
