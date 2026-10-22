import { Router } from 'express';
import { getDbStatus } from '../services/db.js';
import { PRODUCT_CONFIG } from '../utils/productConfig.js';

const router = Router();

// GET /api/settings/status — System configuration health check
router.get('/status', (req, res) => {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
  const dbStatus = getDbStatus();
  const realtimeModel = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
  const summaryModel = process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini';
  const voice = process.env.OPENAI_VOICE || 'alloy';

  return res.status(200).json({
    success: true,
    data: {
      status: 'online',
      openai: {
        configured: hasOpenAiKey,
        realtimeModel,
        summaryModel,
        voice,
        keyPrefix: hasOpenAiKey ? `${process.env.OPENAI_API_KEY.slice(0, 7)}...` : null
      },
      supabase: {
        configured: dbStatus.supabaseConfigured,
        type: dbStatus.type,
        url: dbStatus.url ? `${dbStatus.url.slice(0, 20)}...` : null
      },
      environment: process.env.NODE_ENV || 'development'
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
