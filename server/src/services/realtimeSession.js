import { buildSalesSystemPrompt } from '../utils/productConfig.js';

export async function createRealtimeSession() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()?.replace(/^['"]|['"]$/g, '');

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    const error = new Error('OpenAI API key is missing. Please set OPENAI_API_KEY in your server environment or .env file.');
    error.statusCode = 400;
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  const model = process.env.OPENAI_REALTIME_MODEL?.trim()?.replace(/^['"]|['"]$/g, '') || 'gpt-4o-realtime-preview-2024-12-17';
  const voice = process.env.OPENAI_VOICE?.trim()?.replace(/^['"]|['"]$/g, '') || 'alloy';
  const instructions = buildSalesSystemPrompt();

  const sessionConfig = {
    model,
    voice,
    instructions,
    input_audio_transcription: {
      model: 'whisper-1'
    },
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    }
  };

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
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

    if (!data.client_secret || !data.client_secret.value) {
      throw new Error('OpenAI response did not include client_secret.value ephemeral key.');
    }

    return {
      client_secret: data.client_secret,
      sessionId: data.id,
      model: data.model,
      voice: data.voice
    };
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 502;
    }
    throw err;
  }
}
