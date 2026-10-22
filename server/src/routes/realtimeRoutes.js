import { Router } from 'express';
import { createRealtimeSession } from '../services/realtimeSession.js';

const router = Router();

router.post('/session', async (req, res) => {
  try {
    const session = await createRealtimeSession();
    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error('Realtime session creation route error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code || 'REALTIME_SESSION_FAILED',
        details: err.details || null
      }
    });
  }
});

export default router;
