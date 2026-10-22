import { Router } from 'express';
import { getDbStatus } from '../services/db.js';
import { PRODUCT_CONFIG } from '../utils/productConfig.js';

const router = Router();

// GET /api/settings/status — System configuration health check
router.get('/status', (req, res) => {
  const rawKey = process.env.OPENAI_API_KEY?.trim()?.replace(/^['"]|['"]$/g, '');
  const hasOpenAiKey = Boolean(rawKey && rawKey !== 'your_openai_api_key_here' && rawKey.length > 10);
  let realtimeModel = process.env.OPENAI_REALTIME_MODEL?.trim()?.replace(/^['"]|['"]$/g, '');
  if (!realtimeModel || realtimeModel.includes('preview')) {
    realtimeModel = 'gpt-realtime-mini';
  }
  const summaryModel = process.env.OPENAI_SUMMARY_MODEL?.trim()?.replace(/^['"]|['"]$/g, '') || 'gpt-4o-mini';
  const voice = process.env.OPENAI_VOICE?.trim()?.replace(/^['"]|['"]$/g, '') || 'alloy';

  return res.status(200).json({
    success: true,
    data: {
      status: 'online',
      openai: {
        configured: hasOpenAiKey,
        realtimeModel,
        summaryModel,
        voice,
        keyPrefix: hasOpenAiKey ? `${rawKey.slice(0, 7)}...` : null
      },
      supabase: {
        configured: dbStatus.supabaseConfigured,
        type: dbStatus.type,
        url: dbStatus.url ? `${dbStatus.url.slice(0, 25)}...` : null
      },
      environment: process.env.NODE_ENV || (process.env.VERCEL ? 'production' : 'development')
    }
  });
});

// GET /api/settings/product — Returns centralized product configuration
router.get('/product', (req, res) => {
  return res.status(200).json({
    success: true,
    data: PRODUCT_CONFIG
  });
});

export default router;
