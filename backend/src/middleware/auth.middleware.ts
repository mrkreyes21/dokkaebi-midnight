import { Request, Response, NextFunction } from 'express';
import { IdentityService, VerifiedPlayer } from '../services/identity.service.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      player?: VerifiedPlayer;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const signedPlayerInfo = (req.headers['x-fb-signed-player-info'] as string) || req.body?.signedPlayerInfo;
  const devPlayerId = (req.headers['x-dev-player-id'] as string) || req.body?.devPlayerId;
  const devPlayerName = (req.headers['x-dev-player-name'] as string) || req.body?.devPlayerName;

  try {
    const player = await IdentityService.authenticatePlayer({
      signedPlayerInfo,
      devPlayerId,
      devPlayerName,
    });
    req.player = player;
    next();
  } catch (err: unknown) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: err instanceof Error ? err.message : 'Invalid player credentials',
    });
  }
}
