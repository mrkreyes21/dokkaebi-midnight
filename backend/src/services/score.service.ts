import { getDbPool } from '../database/pool.js';

export interface CommitScoreResult {
  accepted: boolean;
  score: number;
  personalBest: number;
  isNewBest: boolean;
}

export class ScoreService {
  /**
   * Atomically finalizes the session, logs score, and updates player's personal best.
   */
  public static async commitSessionScore(
    sessionId: string,
    playerId: string,
    score: number
  ): Promise<CommitScoreResult> {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN;');

      // 1. Mark session as COMPLETED (enforcing idempotency)
      const updateSessionQuery = `
        UPDATE game_sessions
        SET status = 'COMPLETED', completed_at = NOW()
        WHERE id = $1 AND status = 'ACTIVE'
        RETURNING id;
      `;
      const sessionRes = await client.query(updateSessionQuery, [sessionId]);
      if (sessionRes.rowCount === 0) {
        throw new Error('SESSION_ALREADY_FINALIZED');
      }

      // 2. Insert into scores table
      const insertScoreQuery = `
        INSERT INTO scores (player_id, session_id, score)
        VALUES ($1, $2, $3)
        RETURNING id;
      `;
      await client.query(insertScoreQuery, [playerId, sessionId, score]);

      // 3. Check and update player personal best
      const playerQuery = `
        SELECT best_score FROM players WHERE id = $1 FOR UPDATE;
      `;
      const playerRes = await client.query(playerQuery, [playerId]);
      const currentBest = playerRes.rows[0]?.best_score ?? 0;

      let isNewBest = false;
      let personalBest = currentBest;

      if (score > currentBest) {
        isNewBest = true;
        personalBest = score;
        await client.query(
          'UPDATE players SET best_score = $1, updated_at = NOW() WHERE id = $2;',
          [score, playerId]
        );
      }

      await client.query('COMMIT;');

      return {
        accepted: true,
        score,
        personalBest,
        isNewBest,
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }
}
