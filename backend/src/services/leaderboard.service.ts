import { LeaderboardEntry, LeaderboardResponse } from '@dokkaebi/shared';
import { getDbPool } from '../database/pool.js';

export class LeaderboardService {
  /**
   * Retrieves the top 10 accepted scores and current player's standing.
   */
  public static async getTopScores(playerId?: string): Promise<LeaderboardResponse> {
    const pool = getDbPool();

    // 1. Fetch Top 10 players
    const topQuery = `
      SELECT id, display_name, best_score, updated_at
      FROM players
      WHERE best_score > 0
      ORDER BY best_score DESC, updated_at ASC
      LIMIT 10;
    `;

    const res = await pool.query(topQuery);
    const topScores: LeaderboardEntry[] = res.rows.map((row, index) => ({
      rank: index + 1,
      playerId: row.id,
      displayName: row.display_name,
      score: row.best_score,
      achievedAt: row.updated_at.toISOString(),
    }));

    // 2. Fetch current player's ranking if requested
    let playerEntry: LeaderboardEntry | null = null;

    if (playerId) {
      // Check if player is already in topScores
      const foundInTop = topScores.find((e) => e.playerId === playerId);
      if (foundInTop) {
        playerEntry = foundInTop;
      } else {
        // Query player's absolute rank across all players
        const rankQuery = `
          WITH ranked AS (
            SELECT id, display_name, best_score, updated_at,
                   ROW_NUMBER() OVER (ORDER BY best_score DESC, updated_at ASC) as rank
            FROM players
            WHERE best_score > 0
          )
          SELECT rank, id, display_name, best_score, updated_at
          FROM ranked
          WHERE id = $1;
        `;
        const rankRes = await pool.query(rankQuery, [playerId]);
        if (rankRes.rows.length > 0) {
          const r = rankRes.rows[0];
          playerEntry = {
            rank: parseInt(r.rank, 10),
            playerId: r.id,
            displayName: r.display_name,
            score: r.best_score,
            achievedAt: r.updated_at.toISOString(),
          };
        }
      }
    }

    return {
      topScores,
      playerEntry,
    };
  }
}
