import { TargetType, ScheduledTarget } from './game.types.js';

/**
 * Deterministic Mulberry32 PRNG
 * Fast, seedable, high-quality 32-bit PRNG
 */
export class DeterministicPRNG {
  private state: number;

  constructor(seedString: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < seedString.length; i++) {
      h ^= seedString.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    this.state = h >>> 0;
  }

  public next(): number {
    let z = (this.state += 0x6d2b79f5);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  public between(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

/**
 * Target lifetime and point definitions
 */
const TARGET_SPECS: Record<TargetType, { points: number; lifetimeMs: number; weight: number; minSec: number }> = {
  [TargetType.BABY]: { points: 1, lifetimeMs: 2000, weight: 55, minSec: 0 },
  [TargetType.GOLDEN]: { points: 5, lifetimeMs: 1500, weight: 15, minSec: 5 },
  [TargetType.FIRE]: { points: 3, lifetimeMs: 1500, weight: 15, minSec: 8 },
  [TargetType.CURSED]: { points: -2, lifetimeMs: 1800, weight: 15, minSec: 10 },
  [TargetType.ANCIENT]: { points: 10, lifetimeMs: 1200, weight: 5, minSec: 20 },
};

/**
 * Deterministically generates the target schedule for a 30-second round from a seed string.
 */
export function generateTargetSchedule(seed: string): ScheduledTarget[] {
  const prng = new DeterministicPRNG(seed);
  const targets: ScheduledTarget[] = [];
  let currentTimeMs = 850;
  let counter = 1;

  while (currentTimeMs < 29200) {
    const elapsedSec = currentTimeMs / 1000;

    // 1. Filter available targets based on difficulty tier
    const availableTypes: TargetType[] = [];
    const weights: number[] = [];

    for (const [type, spec] of Object.entries(TARGET_SPECS)) {
      if (elapsedSec >= spec.minSec) {
        availableTypes.push(type as TargetType);
        weights.push(spec.weight);
      }
    }

    // 2. Select target type
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let rand = prng.next() * totalWeight;
    let selectedType = availableTypes[0];

    for (let i = 0; i < availableTypes.length; i++) {
      if (rand < weights[i]) {
        selectedType = availableTypes[i];
        break;
      }
      rand -= weights[i];
    }

    const spec = TARGET_SPECS[selectedType];

    // 3. Normalized coordinates (0.0 to 1.0 within safe zone)
    const xRatio = prng.next();
    const yRatio = prng.next();

    const targetId = `target_${counter}_${selectedType}`;
    counter++;

    targets.push({
      id: targetId,
      type: selectedType,
      spawnMs: Math.round(currentTimeMs),
      lifetimeMs: spec.lifetimeMs,
      xRatio,
      yRatio,
      points: spec.points,
    });

    // 4. Calculate next spawn interval based on difficulty tier
    let baseInterval = 850;
    if (elapsedSec >= 20) {
      baseInterval = 450;
    } else if (elapsedSec >= 10) {
      baseInterval = 650;
    }

    // Interval with deterministic jitter (±10%)
    const jitter = 0.9 + prng.next() * 0.2;
    currentTimeMs += baseInterval * jitter;
  }

  return targets;
}
