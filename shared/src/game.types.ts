/**
 * Target types defined in plan.md
 */
export enum TargetType {
  BABY = 'BABY',       // Common cyan spirit: +1 pt, 2.0s
  GOLDEN = 'GOLDEN',   // High-value gold spirit: +5 pts, 1.5s
  FIRE = 'FIRE',       // Distinct floating flame: +3 pts, 1.5s
  CURSED = 'CURSED',   // Muted crimson hazard: -2 pts, 1.8s
  ANCIENT = 'ANCIENT', // Rare ornate spirit: +10 pts, 1.2s
}

/**
 * Target configuration constants
 */
export interface TargetDefinition {
  type: TargetType;
  name: string;
  points: number;
  lifetimeMs: number;
  radius: number;
  color: number;        // Hex color for rendering/fallback
  ringColor: number;
  weight: number;       // Spawn probability weight
  minDifficultySec: number; // When this target can start spawning
}

/**
 * An individual scheduled target instance in a game round
 */
export interface ScheduledTarget {
  id: string;
  type: TargetType;
  spawnMs: number;
  lifetimeMs: number;
  xRatio: number; // Normalized coordinate 0.0 - 1.0 within safe zone
  yRatio: number; // Normalized coordinate 0.0 - 1.0 within safe zone
  points: number;
}

/**
 * Player interaction event sent to server for verification
 */
export interface TargetInteractionEvent {
  targetId: string;
  action: 'tap';
  elapsedMs: number;
}

/**
 * Summary of a round result
 */
export interface RoundSummary {
  finalScore: number;
  totalHits: number;
  totalMissed: number;
  hazardHits: number;
  maxCombo: number;
  isNewBest: boolean;
}
