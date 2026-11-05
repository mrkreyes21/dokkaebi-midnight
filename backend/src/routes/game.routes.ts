import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { sessionRateLimiter, finishRateLimiter } from '../middleware/rateLimit.middleware.js';
import { SessionService } from '../services/session.service.js';
import { ValidationService } from '../services/validation.service.js';
import { ScoreService } from '../services/score.service.js';

export const gameRouter = Router();

const finishSchema = z.object({
  events: z.array(
    z.object({
      targetId: z.string(),
      action: z.literal('tap'),
      elapsedMs: z.number().int().nonnegative(),
    })
  ),
  clientScore: z.number().optional(), // For diagnostics only, not trusted
});

/**
 * POST /api/game/sessions
 * Starts a new game session
 */
gameRouter.post(
  '/sessions',
  sessionRateLimiter,
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const player = req.player!;
      const session = await SessionService.createSession(player.id);
      res.status(201).json(session);
    } catch (err: unknown) {
      console.error('[GameRoutes] Session creation failed:', err);
      res.status(500).json({ error: 'SESSION_CREATION_FAILED' });
    }
  }
);

/**
 * POST /api/game/sessions/:sessionId/finish
 * Validates submitted interaction events and calculates authoritative score
 */
gameRouter.post(
  '/sessions/:sessionId/finish',
  finishRateLimiter,
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId as string;
      const player = req.player!;

      const parsed = finishSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          accepted: false,
          errorCode: 'INVALID_REQUEST_BODY',
          errorMessage: 'Request body does not conform to event schema',
        });
        return;
      }

      const session = await SessionService.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          accepted: false,
          errorCode: 'SESSION_NOT_FOUND',
          errorMessage: 'No active session found with this ID',
        });
        return;
      }

      // Authoritative validation
      const validation = ValidationService.validateSessionEvents(
        session,
        player.id,
        parsed.data.events
      );

      if (!validation.isValid) {
        res.status(400).json({
          accepted: false,
          errorCode: validation.errorCode,
          errorMessage: validation.errorMessage,
        });
        return;
      }

      // Commit validated score to database in transaction
      const result = await ScoreService.commitSessionScore(
        sessionId,
        player.id,
        validation.calculatedScore
      );

      res.status(200).json(result);
    } catch (err: unknown) {
      console.error('[GameRoutes] Session finish error:', err);
      res.status(500).json({
        accepted: false,
        errorCode: 'SERVER_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Error finalizing score',
      });
    }
  }
);
