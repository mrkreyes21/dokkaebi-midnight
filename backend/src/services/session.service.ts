import crypto from 'crypto';
import { CreateSessionResponse } from '@dokkaebi/shared';
import { getDbPool } from '../database/pool.js';

export interface GameSessionRecord {
  id: string;
  playerId: string;
  seed: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REJECTED';
  configVersion: number;
  startedAt: Date;
  expiresAt: Date;
  completedAt?: Date | null;
}

export class SessionService {
  /**
   * Creates an active game session for the player with a cryptographic seed and expiration.
   */
  public static async createSession(playerId: string): Promise<CreateSessionResponse> {
    const seed = crypto.randomBytes(16).toString('hex');
    const startedAt = new Date();
    // 30 seconds active gameplay + 15 seconds grace period for network latency
    const expiresAt = new Date(startedAt.getTime() + 45000);

    const pool = getDbPool();
    const query = `
      INSERT INTO game_sessions (player_id, seed, status, config_version, started_at, expires_at)
      VALUES ($1, $2, 'ACTIVE', 1, $3, $4)
      RETURNING id, seed, started_at, expires_at, config_version;
    `;

    const res = await pool.query(query, [playerId, seed, startedAt, expiresAt]);
    const row = res.rows[0];

    return {
      sessionId: row.id,
      seed: row.seed,
      startedAt: row.started_at.toISOString(),
      expiresAt: row.expires_at.toISOString(),
      gameConfigVersion: row.config_version,
    };
  }

  /**
   * Fetches session by ID.
   */
  public static async getSession(sessionId: string): Promise<GameSessionRecord | null> {
    const pool = getDbPool();
    const query = `
      SELECT id, player_id, seed, status, config_version, started_at, expires_at, completed_at
      FROM game_sessions
      WHERE id = $1;
    `;

    const res = await pool.query(query, [sessionId]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      playerId: row.player_id,
      seed: row.seed,
      status: row.status,
      configVersion: row.config_version,
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      completedAt: row.completed_at,
    };
  }
}
