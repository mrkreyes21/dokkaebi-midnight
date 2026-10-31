import Phaser from 'phaser';
import { TargetDefinition, TargetType } from '@dokkaebi/shared';

export interface TargetHitCallback {
  (targetId: string, type: TargetType, points: number, x: number, y: number): void;
}

export interface TargetExpireCallback {
  (targetId: string, type: TargetType): void;
}

export class DokkaebiTarget extends Phaser.GameObjects.Container {
  public readonly targetId: string;
  public readonly targetDef: TargetDefinition;
  
  private remainingLifetimeMs: number;
  private totalLifetimeMs: number;
  private ringGraphics: Phaser.GameObjects.Graphics;
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private isHit: boolean = false;
  private isExpired: boolean = false;

  private onHitCallback: TargetHitCallback;
  private onExpireCallback: TargetExpireCallback;

  constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    targetDef: TargetDefinition,
    onHit: TargetHitCallback,
    onExpire: TargetExpireCallback
  ) {
    super(scene, x, y);
    this.targetId = id;
    this.targetDef = targetDef;
    this.totalLifetimeMs = targetDef.lifetimeMs;
    this.remainingLifetimeMs = targetDef.lifetimeMs;
    this.onHitCallback = onHit;
    this.onExpireCallback = onExpire;

    // Outer shrinking ring graphics
    this.ringGraphics = scene.add.graphics();
    this.add(this.ringGraphics);

    // Main body graphics
    this.bodyGraphics = scene.add.graphics();
    this.add(this.bodyGraphics);

    this.drawBody();

    // Set generous hit area matching radius + touch padding
    const hitPadding = 16;
    const hitRadius = targetDef.radius + hitPadding;
    this.setSize(hitRadius * 2, hitRadius * 2);
    this.setInteractive(
      new Phaser.Geom.Circle(0, 0, hitRadius),
      Phaser.Geom.Circle.Contains
    );

    // Input listener
    this.on('pointerdown', this.handlePointerDown, this);

    // Entrance pop tween
    this.setScale(0);
    this.setAlpha(0);
    scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });

    scene.add.existing(this);
  }

  private drawBody(): void {
    const r = this.targetDef.radius;
    const g = this.bodyGraphics;
    g.clear();

    // Outer subtle glow
    g.fillStyle(this.targetDef.color, 0.25);
    g.fillCircle(0, 0, r + 6);

    // Solid base body
    g.fillStyle(this.targetDef.color, 1);
    g.fillCircle(0, 0, r);

    // Inner highlight ring
    g.lineStyle(2, 0xffffff, 0.4);
    g.strokeCircle(0, 0, r - 2);

    // Distinct character silhouettes based on target type
    g.fillStyle(0x171326, 0.85);

    switch (this.targetDef.type) {
      case TargetType.BABY:
        // Cute Dokkaebi: two tiny horns, round eyes, small happy mouth
        // Tiny horns
        g.fillStyle(0xffffff, 0.9);
        g.fillTriangle(-12, -r + 8, -6, -r - 6, 0, -r + 8);
        g.fillTriangle(0, -r + 8, 6, -r - 6, 12, -r + 8);
        // Eyes
        g.fillStyle(0x171326, 1);
        g.fillCircle(-10, -2, 4);
        g.fillCircle(10, -2, 4);
        // Eye reflections
        g.fillStyle(0xffffff, 1);
        g.fillCircle(-8, -4, 1.5);
        g.fillCircle(12, -4, 1.5);
        // Happy curved smile
        g.lineStyle(2, 0x171326, 1);
        g.beginPath();
        g.arc(0, 4, 7, 0.2, Math.PI - 0.2, false);
        g.strokePath();
        break;

      case TargetType.GOLDEN:
        // Golden Dokkaebi: Single large golden horn + starry eyes
        g.fillStyle(0xfff3a8, 1);
        g.fillTriangle(-8, -r + 6, 0, -r - 12, 8, -r + 6);
        // Sparkle aura
        g.fillStyle(0x171326, 1);
        g.fillCircle(-9, -2, 4);
        g.fillCircle(9, -2, 4);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(-7, -4, 2);
        g.fillCircle(11, -4, 2);
        // Grin
        g.lineStyle(2.5, 0x171326, 1);
        g.beginPath();
        g.arc(0, 5, 8, 0.1, Math.PI - 0.1, false);
        g.strokePath();
        break;

      case TargetType.FIRE:
        // Fire Spirit: Floating flame silhouette in center
        g.fillStyle(0xffffff, 0.95);
        g.fillTriangle(-12, 10, 0, -r + 8, 12, 10);
        g.fillCircle(0, 8, 12);
        // Inner core
        g.fillStyle(0x3be0b8, 1);
        g.fillCircle(0, 6, 6);
        break;

      case TargetType.CURSED:
        // Cursed Dokkaebi: Jagged horns, angry eyes, sharp fangs
        g.fillStyle(0x4a1122, 1);
        g.fillTriangle(-14, -r + 10, -14, -r - 8, -4, -r + 10);
        g.fillTriangle(4, -r + 10, 14, -r - 8, 14, -r + 10);
        // Slanted menacing eyes
        g.lineStyle(3, 0xfff0f3, 1);
        g.beginPath();
        g.moveTo(-14, -6);
        g.lineTo(-4, 0);
        g.moveTo(14, -6);
        g.lineTo(4, 0);
        g.strokePath();
        // Sharp fangs
        g.fillStyle(0xffffff, 1);
        g.fillTriangle(-6, 6, -3, 12, 0, 6);
        g.fillTriangle(0, 6, 3, 12, 6, 6);
        break;

      case TargetType.ANCIENT:
        // Ancient Dokkaebi: Crowned dual horns, mystical third eye
        g.fillStyle(0xf3e5ff, 1);
        g.fillTriangle(-16, -r + 8, -10, -r - 10, -4, -r + 8);
        g.fillTriangle(4, -r + 8, 10, -r - 10, 16, -r + 8);
        // Third eye
        g.fillStyle(0xffd700, 1);
        g.fillCircle(0, -10, 4.5);
        // Dual eyes
        g.fillStyle(0x171326, 1);
        g.fillCircle(-10, 2, 4);
        g.fillCircle(10, 2, 4);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(-8, 0, 1.5);
        g.fillCircle(12, 0, 1.5);
        break;
    }
  }

  public updateLifetime(deltaMs: number): void {
    if (this.isHit || this.isExpired) return;

    this.remainingLifetimeMs -= deltaMs;

    if (this.remainingLifetimeMs <= 0) {
      this.handleExpire();
      return;
    }

    // Update shrinking circular lifetime indicator
    const progress = Math.max(0, this.remainingLifetimeMs / this.totalLifetimeMs);
    const startRadius = this.targetDef.radius + 28;
    const endRadius = this.targetDef.radius + 4;
    const currentRadius = endRadius + (startRadius - endRadius) * progress;

    const g = this.ringGraphics;
    g.clear();

    // Background track ring
    g.lineStyle(1.5, 0xffffff, 0.15);
    g.strokeCircle(0, 0, currentRadius);

    // Active shrinking ring
    const ringColor = this.targetDef.ringColor;
    g.lineStyle(3, ringColor, 0.85);

    // Draw partial arc proportional to remaining lifetime
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * progress;
    g.beginPath();
    g.arc(0, 0, currentRadius, startAngle, endAngle, false);
    g.strokePath();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isHit || this.isExpired) return;
    this.isHit = true;
    this.disableInteractive();

    // Trigger callback
    this.onHitCallback(
      this.targetId,
      this.targetDef.type,
      this.targetDef.points,
      this.x,
      this.y
    );

    // Play hit pop animation
    this.ringGraphics.clear();
    this.scene.tweens.add({
      targets: this,
      scale: 1.35,
      alpha: 0,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  private handleExpire(): void {
    this.isExpired = true;
    this.disableInteractive();
    this.onExpireCallback(this.targetId, this.targetDef.type);

    this.ringGraphics.clear();
    this.scene.tweens.add({
      targets: this,
      scale: 0.3,
      alpha: 0,
      duration: 140,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  public destroy(fromScene?: boolean): void {
    this.off('pointerdown', this.handlePointerDown, this);
    super.destroy(fromScene);
  }
}
