import {
  TargetInteractionEvent,
  ScheduledTarget,
  generateTargetSchedule,
} from '@dokkaebi/shared';
import { GameSessionRecord } from './session.service.js';

export interface ValidationSuccess {
  isValid: true;
  calculatedScore: number;
  totalHits: number;
  hazardHits: number;
  maxStreak: number;
}

export interface ValidationFailure {
  isValid: false;
  errorCode: string;
  errorMessage: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export class ValidationService {
  /**
   * Validates interaction events against the deterministic session schedule and calculates final score.
   */
  public static validateSessionEvents(
    session: GameSessionRecord,
    playerId: string,
    events: TargetInteractionEvent[]
  ): ValidationResult {
    const now = Date.now();

    // 1. Session Ownership Verification
    if (session.playerId !== playerId) {
      return {
        isValid: false,
        errorCode: 'SESSION_FORBIDDEN',
        errorMessage: 'Session does not belong to the authenticated player',
      };
    }

    // 2. Session Status Check
    if (session.status !== 'ACTIVE') {
      return {
        isValid: false,
        errorCode: 'SESSION_ALREADY_COMPLETED',
        errorMessage: `Session is already in ${session.status} state`,
      };
    }

    // 3. Expiration Check
    if (now > session.expiresAt.getTime()) {
      return {
        isValid: false,
        errorCode: 'SESSION_EXPIRED',
        errorMessage: 'Session expired before submission',
      };
    }

    // 4. Minimum Duration Check (cannot legitimately finish a 30s round in under 28s)
    const sessionAgeMs = now - session.startedAt.getTime();
    if (sessionAgeMs < 28000) {
      return {
        isValid: false,
        errorCode: 'ROUND_TOO_SHORT',
        errorMessage: 'Submitted before active 30s gameplay completed',
      };
    }

    // 5. Event Count Plausibility Check (max 100 taps in 30 seconds)
    if (!Array.isArray(events)) {
      return {
        isValid: false,
        errorCode: 'INVALID_PAYLOAD',
        errorMessage: 'Events must be an array',
      };
    }

    if (events.length > 100) {
      return {
        isValid: false,
        errorCode: 'EXCESSIVE_EVENT_COUNT',
        errorMessage: 'Event count exceeds human physical plausibility limit',
      };
    }

    // Reconstruct the authoritative target schedule for this session's seed
    const schedule = generateTargetSchedule(session.seed);
    const scheduleMap = new Map<string, ScheduledTarget>();
    for (const target of schedule) {
      scheduleMap.set(target.id, target);
    }

    const seenTargets = new Set<string>();
    let lastElapsedMs = -1;
    let score = 0;
    let streak = 0;
    let maxStreak = 0;
    let totalHits = 0;
    let hazardHits = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // A. Schema & action type validation
      if (!event.targetId || event.action !== 'tap' || typeof event.elapsedMs !== 'number') {
        return {
          isValid: false,
          errorCode: 'MALFORMED_EVENT',
          errorMessage: `Event at index ${i} is malformed`,
        };
      }

      // B. Monotonically non-decreasing timestamps
      if (event.elapsedMs < lastElapsedMs) {
        return {
          isValid: false,
          errorCode: 'OUT_OF_ORDER_TIMESTAMPS',
          errorMessage: `Event timestamp ${event.elapsedMs}ms is before previous ${lastElapsedMs}ms`,
        };
      }

      // C. Minimum physical motor delay between taps (100ms)
      if (lastElapsedMs >= 0 && event.elapsedMs - lastElapsedMs < 100) {
        return {
          isValid: false,
          errorCode: 'IMPOSSIBLE_REFLEX_SPEED',
          errorMessage: `Inter-tap delay ${event.elapsedMs - lastElapsedMs}ms violates human reflex limits`,
        };
      }
      lastElapsedMs = event.elapsedMs;

      // D. Target existence verification
      const scheduledTarget = scheduleMap.get(event.targetId);
      if (!scheduledTarget) {
        return {
          isValid: false,
          errorCode: 'UNKNOWN_TARGET_ID',
          errorMessage: `Target ID ${event.targetId} does not exist in round schedule`,
        };
      }

      // E. Duplicate tap prevention
      if (seenTargets.has(event.targetId)) {
        return {
          isValid: false,
          errorCode: 'DUPLICATE_TARGET_TAP',
          errorMessage: `Target ${event.targetId} was tapped multiple times`,
        };
      }
      seenTargets.add(event.targetId);

      // F. Availability window verification (spawnMs <= tap <= spawnMs + lifetimeMs + 250ms tolerance)
      const minValidMs = scheduledTarget.spawnMs - 80; // 80ms client render tolerance
      const maxValidMs = scheduledTarget.spawnMs + scheduledTarget.lifetimeMs + 250; // 250ms network/frame drop tolerance

      if (event.elapsedMs < minValidMs || event.elapsedMs > maxValidMs) {
        return {
          isValid: false,
          errorCode: 'TARGET_NOT_ACTIVE',
          errorMessage: `Target ${event.targetId} tapped outside active lifetime [${minValidMs}ms - ${maxValidMs}ms]. Tapped at ${event.elapsedMs}ms.`,
        };
      }

      // G. Authoritative Score Tallying
      if (scheduledTarget.points > 0) {
        streak++;
        totalHits++;
        if (streak > maxStreak) maxStreak = streak;

        // Combo bonus: +2 points for every 5 consecutive catches
        let bonus = 0;
        if (streak >= 5 && streak % 5 === 0) {
          bonus = 2;
        }

        score += scheduledTarget.points + bonus;
      } else {
        // Cursed Dokkaebi penalty
        streak = 0;
        hazardHits++;
        score += scheduledTarget.points; // adds -2
      }
    }

    // Score safety bounds: round cannot mathematically exceed theoretical max (e.g. 160 pts)
    if (score > 160) {
      return {
        isValid: false,
        errorCode: 'IMPLAUSIBLE_SCORE',
        errorMessage: `Calculated score ${score} exceeds theoretical round ceiling`,
      };
    }

    return {
      isValid: true,
      calculatedScore: Math.max(0, score),
      totalHits,
      hazardHits,
      maxStreak,
    };
  }
}
