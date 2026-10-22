import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import realtimeRoutes from './routes/realtimeRoutes.js';
import callRoutes from './routes/callRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { initDb } from './services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded if running locally
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize database
initDb();

export function createApp() {
  const app = express();

  // CORS configuration
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for assignment demo review
    },
    credentials: true
  }));

  // JSON Body parser
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Static audio serving for local storage mode
  const isVercel = Boolean(process.env.VERCEL);
  const localRecordingsDir = isVercel
    ? '/tmp/recordings'
    : path.resolve(__dirname, '../uploads/recordings');

  app.use('/api/recordings', express.static(localRecordingsDir, {
    setHeaders: (res) => {
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }));

  // API Routes
  app.use('/api/realtime', realtimeRoutes);
  app.use('/api/calls', callRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'SalesFlow AI Voice Sales Server',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler for unmatched API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`
    });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  });

  return app;
}

// Export default app instance as expected by Vercel Express service runtime
const app = createApp();
export default app;
