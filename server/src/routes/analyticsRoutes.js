import { Router } from 'express';
import { getAnalytics } from '../services/db.js';

const router = Router();

// GET /api/analytics
router.get('/', async (req, res) => {
  try {
    const analytics = await getAnalytics();
    return res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error('Error fetching analytics:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load dashboard analytics' });
  }
});

export default router;
