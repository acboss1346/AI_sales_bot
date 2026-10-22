import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server dir or root dir
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const port = process.env.PORT || 5001;

// Only start the listener if run directly (standalone or local development)
// In Vercel serverless / services, Vercel imports the app instance directly.
if (!process.env.VERCEL) {
  const server = app.listen(port, () => {
    console.log(`🚀 SalesFlow AI Voice Server running on port ${port}`);
    console.log(`📡 Health check: http://localhost:${port}/api/health`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
}

export default app;
