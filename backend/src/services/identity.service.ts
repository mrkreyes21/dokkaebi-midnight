import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { getDbPool } from '../database/pool.js';

export interface VerifiedPlayer {
  id: string;
  facebookPlayerId: string;
  displayName: string;
  bestScore: number;
}

export interface FacebookSignedPayload {
  algorithm: string;
  issued_at: number;
  player_id: string;
  request_payload?: string;
}

export class IdentityService {
  /**
   * Verifies the HMAC-SHA256 signature from FBInstant.player.getSignedPlayerInfoAsync()
   */
  public static verifyFacebookSignature(
    signedString: string,
    appSecret: string
  ): FacebookSignedPayload | null {
    try {
      const parts = signedString.split('.');
      if (parts.length !== 2) {
        return null;
      }

      const [encodedSig, encodedPayload] = parts;

      // 1. Decode base64url signature to binary buffer
      let base64Sig = encodedSig.replace(/-/g, '+').replace(/_/g, '/');
      while (base64Sig.length % 4) base64Sig += '=';
      const sigBuffer = Buffer.from(base64Sig, 'base64');

      // 2. Compute HMAC-SHA256 over raw encodedPayload
      const hmac = crypto.createHmac('sha256', appSecret);
      hmac.update(encodedPayload);
      const computedDigest = hmac.digest();

      // 3. Timing-safe comparison to prevent timing attacks
      if (
        sigBuffer.length !== computedDigest.length ||
        !crypto.timingSafeEqual(sigBuffer, computedDigest)
      ) {
        return null;
      }

      // 4. Decode payload JSON
      let base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      while (base64Payload.length % 4) base64Payload += '=';
      const payloadJson = Buffer.from(base64Payload, 'base64').toString('utf8');
      const payload: FacebookSignedPayload = JSON.parse(payloadJson);

      if (payload.algorithm !== 'HMAC-SHA256') {
        return null;
      }

      // 5. Optional freshness check (e.g. reject signatures older than 24h)
      const nowSec = Math.floor(Date.now() / 1000);
      if (Math.abs(nowSec - payload.issued_at) > 86400) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Authenticates player via signed string or development adapter, upserting to database.
   */
  public static async authenticatePlayer(params: {
    signedPlayerInfo?: string;
    devPlayerId?: string;
    devPlayerName?: string;
  }): Promise<VerifiedPlayer> {
    let fbPlayerId: string | null = null;
    let displayName = 'Spirit Hunter';

    // 1. Production Facebook Signature Flow
    if (params.signedPlayerInfo && ENV.FB_APP_SECRET) {
      const verified = IdentityService.verifyFacebookSignature(
        params.signedPlayerInfo,
        ENV.FB_APP_SECRET
      );
      if (verified) {
        fbPlayerId = verified.player_id;
      }
    }

    // 2. Development-Only Adapter
    if (!fbPlayerId && ENV.NODE_ENV === 'development') {
      fbPlayerId = params.devPlayerId || 'mock-dev-player';
      displayName = params.devPlayerName || 'Night Hunter (Dev)';
    }

    if (!fbPlayerId) {
      throw new Error('UNAUTHORIZED_PLAYER');
    }

    // 3. Upsert into database
    const pool = getDbPool();
    const query = `
      INSERT INTO players (facebook_player_id, display_name, best_score)
      VALUES ($1, $2, 0)
      ON CONFLICT (facebook_player_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = NOW()
      RETURNING id, facebook_player_id, display_name, best_score;
    `;

    const res = await pool.query(query, [fbPlayerId, displayName]);
    const row = res.rows[0];

    return {
      id: row.id,
      facebookPlayerId: row.facebook_player_id,
      displayName: row.display_name,
      bestScore: row.best_score,
    };
  }
}
