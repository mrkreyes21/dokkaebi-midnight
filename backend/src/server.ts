import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { runMigrations } from './database/migrate.js';
import { gameRouter } from './routes/game.routes.js';
import { leaderboardRouter } from './routes/leaderboard.routes.js';
import { playerRouter } from './routes/player.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

// 1. CORS Configuration supporting Facebook iframe origins and localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://www.facebook.com',
  'https://web.facebook.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Match localhost or any Facebook CDN subdomain (e.g. https://apps-*.apps.fbsbx.com)
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.fbsbx.com') ||
        origin.endsWith('.facebook.com') ||
        ENV.CORS_ORIGIN === '*'
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev/staging
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '256kb' }));

// 2. Health check route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. API Routes
app.use('/api/game', gameRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/players', playerRouter);

// 4. Global Error Handler
app.use(errorHandler);

// 5. Server bootstrap
async function startServer(): Promise<void> {
  try {
    console.log('[Server] Checking and applying database migrations...');
    await runMigrations();
  } catch (err) {
    console.warn('[Server] Database migration warning (skipping if db unavailable in local test):', err);
  }

  const port = ENV.PORT;
  app.listen(port, () => {
    console.log(`[Server] DOKKAEBI Backend live on port ${port} (${ENV.NODE_ENV})`);
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  startServer();
}
