import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { generateTargetSchedule, TargetInteractionEvent } from '@dokkaebi/shared';
import { ValidationService } from '../services/validation.service.js';
import { GameSessionRecord } from '../services/session.service.js';
import { IdentityService } from '../services/identity.service.js';

describe('ValidationService (Authoritative Score Integrity)', () => {
  const seed = 'test_seed_777';
  const schedule = generateTargetSchedule(seed);

  const mockActiveSession: GameSessionRecord = {
    id: 'session-uuid-1234',
    playerId: 'player-uuid-5678',
    seed,
    status: 'ACTIVE',
    configVersion: 1,
    startedAt: new Date(Date.now() - 29000), // 29s ago
    expiresAt: new Date(Date.now() + 15000), // expires in 15s
  };

  it('accepts legitimate taps and correctly calculates server score', () => {
    // Pick first 3 scheduled targets and simulate human taps during their active window
    const target1 = schedule[0];
    const target2 = schedule[1];
    const target3 = schedule[2];

    const events: TargetInteractionEvent[] = [
      { targetId: target1.id, action: 'tap', elapsedMs: target1.spawnMs + 200 },
      { targetId: target2.id, action: 'tap', elapsedMs: target2.spawnMs + 200 },
      { targetId: target3.id, action: 'tap', elapsedMs: target3.spawnMs + 200 },
    ];

    const result = ValidationService.validateSessionEvents(
      mockActiveSession,
      mockActiveSession.playerId,
      events
    );

    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.calculatedScore).toBeGreaterThan(0);
      expect(result.totalHits).toBe(3);
    }
  });

  it('rejects duplicate taps on the same target', () => {
    const target1 = schedule[0];

    const events: TargetInteractionEvent[] = [
      { targetId: target1.id, action: 'tap', elapsedMs: target1.spawnMs + 100 },
      { targetId: target1.id, action: 'tap', elapsedMs: target1.spawnMs + 250 }, // Duplicate!
    ];

    const result = ValidationService.validateSessionEvents(
      mockActiveSession,
      mockActiveSession.playerId,
      events
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorCode).toBe('DUPLICATE_TARGET_TAP');
    }
  });

  it('rejects unknown target IDs fabricated by a client', () => {
    const events: TargetInteractionEvent[] = [
      { targetId: 'fake_target_99999', action: 'tap', elapsedMs: 1500 },
    ];

    const result = ValidationService.validateSessionEvents(
      mockActiveSession,
      mockActiveSession.playerId,
      events
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorCode).toBe('UNKNOWN_TARGET_ID');
    }
  });

  it('rejects taps outside target availability window', () => {
    const target1 = schedule[0];
    // Tap 10 seconds after target expired
    const events: TargetInteractionEvent[] = [
      { targetId: target1.id, action: 'tap', elapsedMs: target1.spawnMs + target1.lifetimeMs + 5000 },
    ];

    const result = ValidationService.validateSessionEvents(
      mockActiveSession,
      mockActiveSession.playerId,
      events
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorCode).toBe('TARGET_NOT_ACTIVE');
    }
  });

  it('rejects sub-100ms superhuman reflex bot spamming', () => {
    const target1 = schedule[0];
    const target2 = schedule[1];

    const events: TargetInteractionEvent[] = [
      { targetId: target1.id, action: 'tap', elapsedMs: 1500 },
      { targetId: target2.id, action: 'tap', elapsedMs: 1520 }, // only 20ms later! Impossible for human
    ];

    const result = ValidationService.validateSessionEvents(
      mockActiveSession,
      mockActiveSession.playerId,
      events
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorCode).toBe('IMPOSSIBLE_REFLEX_SPEED');
    }
  });

  it('rejects expired sessions', () => {
    const expiredSession: GameSessionRecord = {
      ...mockActiveSession,
      expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
    };

    const result = ValidationService.validateSessionEvents(
      expiredSession,
      expiredSession.playerId,
      []
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorCode).toBe('SESSION_EXPIRED');
    }
  });

  it('rejects sessions submitted prematurely (<28s)', () => {
    const prematureSession: GameSessionRecord = {
      ...mockActiveSession,
      startedAt: new Date(Date.now() - 5000), // Only started 5s ago
    };

    const result = ValidationService.validateSessionEvents(
      prematureSession,
      prematureSession.playerId,
      []
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errorCode).toBe('ROUND_TOO_SHORT');
    }
  });
});

describe('IdentityService (Meta Signed Player Info Verification)', () => {
  const testSecret = 'super_secret_meta_app_key_123';

  function createValidSignedString(payload: object, secret: string): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(encodedPayload);
    const encodedSig = hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${encodedSig}.${encodedPayload}`;
  }

  it('successfully verifies genuine signature and extracts player ID', () => {
    const payload = {
      algorithm: 'HMAC-SHA256',
      issued_at: Math.floor(Date.now() / 1000),
      player_id: 'fb-user-998877',
    };

    const signedStr = createValidSignedString(payload, testSecret);
    const verified = IdentityService.verifyFacebookSignature(signedStr, testSecret);

    expect(verified).not.toBeNull();
    expect(verified?.player_id).toBe('fb-user-998877');
  });

  it('rejects tampered or forged signatures', () => {
    const payload = {
      algorithm: 'HMAC-SHA256',
      issued_at: Math.floor(Date.now() / 1000),
      player_id: 'fb-user-hacker',
    };

    const forgedSignedStr = createValidSignedString(payload, 'wrong_secret');
    const verified = IdentityService.verifyFacebookSignature(forgedSignedStr, testSecret);

    expect(verified).toBeNull();
  });
});
