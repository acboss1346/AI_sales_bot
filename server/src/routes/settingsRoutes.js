import { Router } from 'express';
import { getDbStatus } from '../services/db.js';
import { PRODUCT_CONFIG } from '../utils/productConfig.js';

const router = Router();

// GET /api/settings/status — System configuration health check
router.get('/status', async (req, res) => {
  try {
    const rawKey = process.env.OPENAI_API_KEY?.trim()?.replace(/^['"]|['"]$/g, '');
    const hasOpenAiKey = Boolean(rawKey && rawKey !== 'your_openai_api_key_here' && rawKey.length > 10);
    let realtimeModel = process.env.OPENAI_REALTIME_MODEL?.trim()?.replace(/^['"]|['"]$/g, '');
    if (!realtimeModel || realtimeModel.includes('preview')) {
      realtimeModel = 'gpt-realtime-mini';
    }
    const summaryModel = process.env.OPENAI_SUMMARY_MODEL?.trim()?.replace(/^['"]|['"]$/g, '') || 'gpt-4o-mini';
    const voice = process.env.OPENAI_VOICE?.trim()?.replace(/^['"]|['"]$/g, '') || 'alloy';

    let dbStatus;
    try {
      dbStatus = await getDbStatus();
    } catch (dbErr) {
      console.warn('Database health check error:', dbErr.message);
      dbStatus = {
        type: 'local_json',
        supabaseConfigured: false,
        connected: false,
        status: 'error',
        error: 'Database status unavailable',
        url: null
      };
    }

    const isSystemOnline = Boolean(dbStatus.connected);

    return res.status(200).json({
      success: true,
      data: {
        status: isSystemOnline ? 'online' : 'degraded',
        openai: {
          configured: hasOpenAiKey,
          realtimeModel,
          summaryModel,
          voice,
          keyPrefix: hasOpenAiKey ? `${rawKey.slice(0, 7)}...` : null
        },
        supabase: {
          configured: Boolean(dbStatus.supabaseConfigured && dbStatus.connected),
          type: dbStatus.type,
          connected: Boolean(dbStatus.connected),
          status: dbStatus.status || (dbStatus.connected ? 'healthy' : 'degraded'),
          url: dbStatus.url ? `${dbStatus.url.slice(0, 25)}...` : null
        },
        database: {
          connected: Boolean(dbStatus.connected),
          type: dbStatus.type,
          status: dbStatus.status || (dbStatus.connected ? 'healthy' : 'degraded'),
          mode: dbStatus.supabaseConfigured ? 'supabase' : 'local_json'
        },
        environment: process.env.NODE_ENV || (process.env.VERCEL ? 'production' : 'development')
      }
    });
  } catch (err) {
    console.error('Unhandled status route error:', err.message);
    return res.status(200).json({
      success: true,
      data: {
        status: 'degraded',
        openai: { configured: false },
        supabase: { configured: false, connected: false, type: 'local_json', status: 'error' },
        database: { connected: false, type: 'local_json', status: 'error', mode: 'local_json' },
        environment: process.env.NODE_ENV || (process.env.VERCEL ? 'production' : 'development')
      }
    });
  }
});

// GET /api/settings/product — Returns centralized product configuration
router.get('/product', (req, res) => {
  return res.status(200).json({
    success: true,
    data: PRODUCT_CONFIG
  });
});

export default router;
