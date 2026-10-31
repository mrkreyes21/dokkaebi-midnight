import { TargetDefinition, TargetType } from '@dokkaebi/shared';

export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

export const ROUND_DURATION_MS = 30000; // 30 seconds active gameplay

export const SAFE_PLAY_BOUNDS = {
  minX: 65,
  maxX: 475,
  minY: 160,
  maxY: 820,
};

export const MIN_TARGET_SPACING = 95; // Minimum px distance between target centers

export const COMBO_THRESHOLD = 5; // 5 consecutive positive catches

export const STORAGE_KEYS = {
  BEST_SCORE: 'dokkaebi_midnight_best_score_v1',
  SOUND_ENABLED: 'dokkaebi_midnight_sound_v1',
};

export const COLOR_PALETTE = {
  bgMidnightPlum: 0x171326,
  bgNightNavy: 0x263c61,
  spiritCyan: 0x58c9ed,
  warmGold: 0xd7ad66,
  hazardCrimson: 0xc76e7e,
  ancientPurple: 0xb47bff,
  fireTeal: 0x3be0b8,
  textIvory: 0xf4ebdd,
  textMuted: 0x9f99b2,
};

export const TARGET_DEFINITIONS: Record<TargetType, TargetDefinition> = {
  [TargetType.BABY]: {
    type: TargetType.BABY,
    name: 'Baby Dokkaebi',
    points: 1,
    lifetimeMs: 2000,
    radius: 44,
    color: 0x58c9ed,
    ringColor: 0x8be4ff,
    weight: 55,
    minDifficultySec: 0,
  },
  [TargetType.GOLDEN]: {
    type: TargetType.GOLDEN,
    name: 'Golden Dokkaebi',
    points: 5,
    lifetimeMs: 1500,
    radius: 40,
    color: 0xd7ad66,
    ringColor: 0xffe29a,
    weight: 15,
    minDifficultySec: 5,
  },
  [TargetType.FIRE]: {
    type: TargetType.FIRE,
    name: 'Fire Spirit',
    points: 3,
    lifetimeMs: 1500,
    radius: 38,
    color: 0x3be0b8,
    ringColor: 0x8cffe3,
    weight: 15,
    minDifficultySec: 8,
  },
  [TargetType.CURSED]: {
    type: TargetType.CURSED,
    name: 'Cursed Dokkaebi',
    points: -2,
    lifetimeMs: 1800,
    radius: 44,
    color: 0xc76e7e,
    ringColor: 0xff8fa3,
    weight: 15,
    minDifficultySec: 10,
  },
  [TargetType.ANCIENT]: {
    type: TargetType.ANCIENT,
    name: 'Ancient Dokkaebi',
    points: 10,
    lifetimeMs: 1200,
    radius: 42,
    color: 0xb47bff,
    ringColor: 0xecd7ff,
    weight: 5,
    minDifficultySec: 20,
  },
};
