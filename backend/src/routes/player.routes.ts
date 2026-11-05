import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { LeaderboardService } from '../services/leaderboard.service.js';

export const playerRouter = Router();

/**
 * GET /api/players/me
 * Returns authenticated player profile, best score and rank
 */
playerRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const player = req.player!;
    const leaderboard = await LeaderboardService.getTopScores(player.id);

    res.status(200).json({
      id: player.id,
      displayName: player.displayName,
      bestScore: player.bestScore,
      rank: leaderboard.playerEntry?.rank ?? null,
    });
  } catch (err: unknown) {
    console.error('[PlayerRoutes] Failed to fetch player profile:', err);
    res.status(500).json({ error: 'PLAYER_FETCH_FAILED' });
  }
});
