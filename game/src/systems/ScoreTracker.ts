import { TargetType } from '@dokkaebi/shared';
import { COMBO_THRESHOLD } from '../config/constants.js';
import { getPlatformService } from '../services/platform/PlatformManager.js';

export interface HitResult {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  isComboBonus: boolean;
  currentStreak: number;
  newScore: number;
}

export class ScoreTracker {
  private currentScore: number = 0;
  private streak: number = 0;
  private maxCombo: number = 0;
  private positiveHits: number = 0;
  private hazardHits: number = 0;
  private missedCount: number = 0;
  private initialBestScore: number = 0;

  constructor() {
    this.initialBestScore = getPlatformService().getBestScore();
  }

  public registerHit(type: TargetType, points: number): HitResult {
    let bonusPoints = 0;
    let isComboBonus = false;

    if (points > 0) {
      this.streak++;
      this.positiveHits++;
      if (this.streak > this.maxCombo) {
        this.maxCombo = this.streak;
      }

      // Combo rule from plan.md: Every 5 consecutive positive catches triggers combo reward
      if (this.streak >= COMBO_THRESHOLD && this.streak % COMBO_THRESHOLD === 0) {
        isComboBonus = true;
        // +2 combo bonus reward
        bonusPoints = 2;
      }
    } else {
      // Cursed Dokkaebi hit: breaks streak
      this.streak = 0;
      this.hazardHits++;
    }

    const totalPoints = points + bonusPoints;
    this.currentScore += totalPoints;

    return {
      basePoints: points,
      bonusPoints,
      totalPoints,
      isComboBonus,
      currentStreak: this.streak,
      newScore: this.currentScore,
    };
  }

  public registerMiss(): void {
    this.missedCount++;
    // Plan.md: "A missed target should not automatically punish the player unless that behavior is deliberately tested and documented."
    // Streak is preserved on miss to maintain fluid reflex play, unless player hits a hazard.
  }

  public getScore(): number {
    return this.currentScore;
  }

  public getStreak(): number {
    return this.streak;
  }

  public getMaxCombo(): number {
    return this.maxCombo;
  }

  public getStats() {
    return {
      score: this.currentScore,
      positiveHits: this.positiveHits,
      hazardHits: this.hazardHits,
      missedCount: this.missedCount,
      maxCombo: this.maxCombo,
      initialBestScore: this.initialBestScore,
      isNewBest: this.currentScore > this.initialBestScore && this.currentScore > 0,
    };
  }

  public saveScoreIfBest(): boolean {
    const platform = getPlatformService();
    const currentBest = platform.getBestScore();
    if (this.currentScore > currentBest) {
      platform.saveBestScore(this.currentScore);
      return true;
    }
    return false;
  }

  public reset(): void {
    this.currentScore = 0;
    this.streak = 0;
    this.maxCombo = 0;
    this.positiveHits = 0;
    this.hazardHits = 0;
    this.missedCount = 0;
    this.initialBestScore = getPlatformService().getBestScore();
  }
}
