import { Router, Request, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service.js';
import { IdentityService } from '../services/identity.service.js';
import { ENV } from '../config/env.js';

export const leaderboardRouter = Router();

/**
 * GET /api/leaderboard?limit=10
 * Returns top 10 scores with optional player highlighting
 */
leaderboardRouter.get('/', async (req: Request, res: Response) => {
  try {
    let playerId: string | undefined;

    // Optional authentication to highlight player's own rank
    const signedPlayerInfo = req.headers['x-fb-signed-player-info'] as string;
    const devPlayerId = req.headers['x-dev-player-id'] as string;

    if (signedPlayerInfo || (devPlayerId && ENV.NODE_ENV === 'development')) {
      try {
        const player = await IdentityService.authenticatePlayer({
          signedPlayerInfo,
          devPlayerId,
        });
        playerId = player.id;
      } catch {
        // Continue unauthenticated if auth fails
      }
    }

    const leaderboard = await LeaderboardService.getTopScores(playerId);
    res.status(200).json(leaderboard);
  } catch (err: unknown) {
    console.error('[LeaderboardRoutes] Failed to fetch leaderboard:', err);
    res.status(500).json({ error: 'LEADERBOARD_FETCH_FAILED' });
  }
});
