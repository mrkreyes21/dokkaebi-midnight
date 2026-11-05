import Phaser from 'phaser';
import {
  TargetType,
  TargetInteractionEvent,
  ScheduledTarget,
  generateTargetSchedule,
} from '@dokkaebi/shared';
import {
  SAFE_PLAY_BOUNDS,
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
  private schedule: ScheduledTarget[] = [];
  private nextScheduleIndex: number = 0;
  private ready: boolean = false;

  // Interaction events logged for server score validation
  private recordedEvents: TargetInteractionEvent[] = [];

  constructor(scene: Phaser.Scene, clock: GameClock, callbacks: SpawnManagerCallbacks) {
    this.scene = scene;
    this.clock = clock;
    this.callbacks = callbacks;
  }

  /** Load deterministic schedule from server session seed (required for verified scores). */
  public loadSchedule(seed: string): void {
    this.schedule = generateTargetSchedule(seed);
    this.nextScheduleIndex = 0;
    this.ready = true;
  }

  /** Offline / no-backend fallback: empty schedule means nothing spawns until seed arrives. */
  public isReady(): boolean {
    return this.ready;
  }

  /**
   * Manual hit test — pick the closest living target under the pointer.
   */
  public handlePointerDown(worldX: number, worldY: number): boolean {
    let best: DokkaebiTarget | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const target of this.activeTargets.values()) {
      if (!target.containsPoint(worldX, worldY)) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, target.x, target.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = target;
      }
    }

    if (!best) return false;
    return best.registerHit();
  }

  public update(_deltaMs: number): void {
    if (this.clock.isFinished() || !this.ready) return;

    // Update lifetimes of all active targets
    for (const target of this.activeTargets.values()) {
      target.updateLifetime(_deltaMs);
    }

    const elapsedMs = this.clock.getElapsedMs();

    // Spawn every scheduled target whose spawn time has arrived
    while (
      this.nextScheduleIndex < this.schedule.length &&
      this.schedule[this.nextScheduleIndex].spawnMs <= elapsedMs
    ) {
      this.spawnScheduledTarget(this.schedule[this.nextScheduleIndex]);
      this.nextScheduleIndex++;
    }
  }

  private spawnScheduledTarget(scheduled: ScheduledTarget): void {
    const def = TARGET_DEFINITIONS[scheduled.type];
    if (!def) return;

    const { minX, maxX, minY, maxY } = SAFE_PLAY_BOUNDS;
    const x = minX + scheduled.xRatio * (maxX - minX);
    const y = minY + scheduled.yRatio * (maxY - minY);

    const target = new DokkaebiTarget(
      this.scene,
      scheduled.id,
      x,
      y,
      def,
      (id, type, points, px, py) => this.handleHit(id, type, points, px, py),
      (id, type) => this.handleExpire(id, type)
    );

    this.activeTargets.set(scheduled.id, target);
  }

  private handleHit(targetId: string, type: TargetType, points: number, x: number, y: number): void {
    this.activeTargets.delete(targetId);

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

  /** Destroy live targets but keep recorded events for score submission. */
  public clearActiveTargets(): void {
    for (const target of this.activeTargets.values()) {
      target.destroy();
    }
    this.activeTargets.clear();
  }

  public clearAll(): void {
    this.clearActiveTargets();
    this.recordedEvents = [];
    this.schedule = [];
    this.nextScheduleIndex = 0;
    this.ready = false;
  }
}
