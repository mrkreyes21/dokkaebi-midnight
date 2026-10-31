import Phaser from 'phaser';
import { TargetType, TargetInteractionEvent } from '@dokkaebi/shared';
import {
  SAFE_PLAY_BOUNDS,
  MIN_TARGET_SPACING,
  TARGET_DEFINITIONS,
} from '../config/constants.js';
import { DokkaebiTarget } from '../entities/DokkaebiTarget.js';
import { GameClock } from './GameClock.js';

export interface SpawnManagerCallbacks {
  onTargetHit: (targetId: string, type: TargetType, points: number, x: number, y: number) => void;
  onTargetExpire: (targetId: string, type: TargetType) => void;
}

export class TargetSpawnManager {
  private scene: Phaser.Scene;
  private clock: GameClock;
  private callbacks: SpawnManagerCallbacks;

  private activeTargets: Map<string, DokkaebiTarget> = new Map();
  private targetCounter: number = 0;
  private timeSinceLastSpawnMs: number = 0;
  private nextSpawnIntervalMs: number = 850;

  // Interaction events logged for server score validation
  private recordedEvents: TargetInteractionEvent[] = [];

  constructor(scene: Phaser.Scene, clock: GameClock, callbacks: SpawnManagerCallbacks) {
    this.scene = scene;
    this.clock = clock;
    this.callbacks = callbacks;
  }

  public update(deltaMs: number): void {
    if (this.clock.isFinished()) return;

    // Update lifetimes of all active targets
    for (const [id, target] of this.activeTargets.entries()) {
      target.updateLifetime(deltaMs);
    }

    // Determine current difficulty tier based on elapsed time
    const elapsedMs = this.clock.getElapsedMs();
    const elapsedSec = elapsedMs / 1000;

    let maxSimultaneous = 3;
    let baseInterval = 850;

    if (elapsedSec >= 20) {
      // Midnight Frenzy: 20–30s
      maxSimultaneous = 5;
      baseInterval = 450;
    } else if (elapsedSec >= 10) {
      // The Hunt: 10–20s
      maxSimultaneous = 4;
      baseInterval = 650;
    }

    this.timeSinceLastSpawnMs += deltaMs;

    if (
      this.timeSinceLastSpawnMs >= this.nextSpawnIntervalMs &&
      this.activeTargets.size < maxSimultaneous
    ) {
      this.spawnRandomTarget(elapsedSec);
      this.timeSinceLastSpawnMs = 0;
      // Slight jitter on spawn interval (±10%) for organic reflex pacing
      this.nextSpawnIntervalMs = baseInterval * (0.9 + Math.random() * 0.2);
    }
  }

  private spawnRandomTarget(elapsedSec: number): void {
    // Filter available targets based on current game time
    const availableTypes: TargetType[] = [];
    const weights: number[] = [];

    for (const type of Object.values(TargetType)) {
      const def = TARGET_DEFINITIONS[type];
      if (elapsedSec >= def.minDifficultySec) {
        availableTypes.push(type);
        weights.push(def.weight);
      }
    }

    const selectedType = this.chooseWeightedType(availableTypes, weights);
    const def = TARGET_DEFINITIONS[selectedType];

    // Find safe spawn coordinates
    const pos = this.findSafeSpawnPosition();
    if (!pos) {
      // No safe position found without colliding; skip this spawn tick
      return;
    }

    this.targetCounter++;
    const targetId = `dokkaebi_${this.targetCounter}_${Date.now().toString(36)}`;

    const target = new DokkaebiTarget(
      this.scene,
      targetId,
      pos.x,
      pos.y,
      def,
      (id, type, points, x, y) => this.handleHit(id, type, points, x, y),
      (id, type) => this.handleExpire(id, type)
    );

    this.activeTargets.set(targetId, target);
  }

  private chooseWeightedType(types: TargetType[], weights: number[]): TargetType {
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let rand = Math.random() * totalWeight;

    for (let i = 0; i < types.length; i++) {
      if (rand < weights[i]) {
        return types[i];
      }
      rand -= weights[i];
    }
    return types[0];
  }

  private findSafeSpawnPosition(): { x: number; y: number } | null {
    const { minX, maxX, minY, maxY } = SAFE_PLAY_BOUNDS;
    const maxAttempts = 15;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidateX = Phaser.Math.Between(minX, maxX);
      const candidateY = Phaser.Math.Between(minY, maxY);

      let isSafe = true;
      for (const target of this.activeTargets.values()) {
        const dist = Phaser.Math.Distance.Between(candidateX, candidateY, target.x, target.y);
        if (dist < MIN_TARGET_SPACING) {
          isSafe = false;
          break;
        }
      }

      if (isSafe) {
        return { x: candidateX, y: candidateY };
      }
    }

    return null;
  }

  private handleHit(targetId: string, type: TargetType, points: number, x: number, y: number): void {
    this.activeTargets.delete(targetId);

    // Record interaction event for backend score validation
    this.recordedEvents.push({
      targetId,
      action: 'tap',
      elapsedMs: Math.round(this.clock.getElapsedMs()),
    });

    this.callbacks.onTargetHit(targetId, type, points, x, y);
  }

  private handleExpire(targetId: string, type: TargetType): void {
    this.activeTargets.delete(targetId);
    this.callbacks.onTargetExpire(targetId, type);
  }

  public getRecordedEvents(): TargetInteractionEvent[] {
    return [...this.recordedEvents];
  }

  public getActiveCount(): number {
    return this.activeTargets.size;
  }

  public clearAll(): void {
    for (const target of this.activeTargets.values()) {
      target.destroy();
    }
    this.activeTargets.clear();
    this.recordedEvents = [];
    this.targetCounter = 0;
    this.timeSinceLastSpawnMs = 0;
  }
}
