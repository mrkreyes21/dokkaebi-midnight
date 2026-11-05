import Phaser from 'phaser';
import { TargetType } from '@dokkaebi/shared';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLOR_PALETTE,
  ROUND_DURATION_MS,
  SAFE_PLAY_BOUNDS,
} from '../config/constants.js';
import { GameClock } from '../systems/GameClock.js';
import { ScoreTracker } from '../systems/ScoreTracker.js';
import { TargetSpawnManager } from '../systems/TargetSpawnManager.js';
import { AudioService } from '../services/AudioService.js';
import { ApiService } from '../services/ApiService.js';
import { getPlatformService } from '../services/platform/PlatformManager.js';

export class GameScene extends Phaser.Scene {
  private clock!: GameClock;
  private scoreTracker!: ScoreTracker;
  private spawnManager!: TargetSpawnManager;
  private serverSessionId: string | null = null;

  // HUD Elements
  private timerText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private comboContainer!: Phaser.GameObjects.Container;
  private comboText!: Phaser.GameObjects.Text;
  private frenzyBanner!: Phaser.GameObjects.Container;
  private frenzyTriggered: boolean = false;
  private isRoundOver: boolean = false;

  // Background
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private moonGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.isRoundOver = false;
    this.frenzyTriggered = false;
    this.serverSessionId = null;

    // Initialize systems
    this.clock = new GameClock(ROUND_DURATION_MS);
    this.scoreTracker = new ScoreTracker();
    this.spawnManager = new TargetSpawnManager(this, this.clock, {
      onTargetHit: (id, type, points, x, y) => this.handleTargetHit(id, type, points, x, y),
      onTargetExpire: (_id, _type) => this.handleTargetExpire(),
    });

    // 1. Draw atmospheric midnight background
    this.createBackground();

    // 2. Draw safe play area guides (subtle magical boundary)
    this.createPlayfield();

    // 3. Create HUD (Timer, Score, Combo streak)
    this.createHUD();

    // 4. Scene-level tap/click picking (reliable with Scale.FIT + overlapping targets)
    this.input.on('pointerdown', this.handlePointerDown, this);

    // 5. Handle visibility change / backgrounding
    this.setupLifecycleHandlers();

    // 6. Create server session + load deterministic schedule BEFORE the clock starts
    void this.startRoundWithSession();
  }

  private async startRoundWithSession(): Promise<void> {
    const platform = getPlatformService();
    const signedInfo = await platform.getSignedPlayerInfo().catch(() => null);
    const session = await ApiService.createSession(signedInfo);

    if (this.isRoundOver) return;

    if (session?.seed) {
      this.serverSessionId = session.sessionId;
      this.spawnManager.loadSchedule(session.seed);
    } else {
      // Offline: still playable, but scores won't verify/sync
      const offlineSeed = `offline_${Date.now().toString(36)}`;
      this.spawnManager.loadSchedule(offlineSeed);
      this.serverSessionId = null;
    }

    this.clock.start();
    this.showRoundStartBanner();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isRoundOver) return;
    // worldX/Y respect Scale.FIT letterboxing so taps map to game coords
    this.spawnManager.handlePointerDown(pointer.worldX, pointer.worldY);
  }

  private createBackground(): void {
    this.bgGraphics = this.add.graphics();
    this.bgGraphics.fillGradientStyle(
      COLOR_PALETTE.bgNightNavy,
      COLOR_PALETTE.bgNightNavy,
      COLOR_PALETTE.bgMidnightPlum,
      COLOR_PALETTE.bgMidnightPlum,
      1
    );
    this.bgGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Full Moon
    this.moonGraphics = this.add.graphics();
    this.updateMoonColor(false);
  }

  private updateMoonColor(isFrenzy: boolean): void {
    this.moonGraphics.clear();
    const moonColor = isFrenzy ? 0xff4b6b : 0xfdf7e7;
    const haloColor = isFrenzy ? 0xc76e7e : 0xd7ad66;

    this.moonGraphics.fillStyle(haloColor, 0.08);
    this.moonGraphics.fillCircle(GAME_WIDTH / 2, 80, 75);
    this.moonGraphics.fillStyle(haloColor, 0.15);
    this.moonGraphics.fillCircle(GAME_WIDTH / 2, 80, 55);
    this.moonGraphics.fillStyle(moonColor, 0.95);
    this.moonGraphics.fillCircle(GAME_WIDTH / 2, 80, 36);
  }

  private createPlayfield(): void {
    // Subtle boundary runes or corner accents to define the safe target region
    const g = this.add.graphics();
    g.lineStyle(1, 0x58c9ed, 0.15);
    const { minX, maxX, minY, maxY } = SAFE_PLAY_BOUNDS;
    g.strokeRoundedRect(minX - 10, minY - 10, (maxX - minX) + 20, (maxY - minY) + 20, 16);
  }

  private createHUD(): void {
    const hudY = 32;

    // Timer display (Left side)
    const timerContainer = this.add.container(25, hudY);
    const timerIconBg = this.add.graphics();
    timerIconBg.fillStyle(0x1a152e, 0.85);
    timerIconBg.fillRoundedRect(0, 0, 140, 48, 12);
    timerIconBg.lineStyle(1.5, COLOR_PALETTE.spiritCyan, 0.4);
    timerIconBg.strokeRoundedRect(0, 0, 140, 48, 12);
    timerContainer.add(timerIconBg);

    const timerLabel = this.add.text(12, 8, 'TIME', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '10px',
      color: '#9F99B2',
      fontStyle: '700',
      letterSpacing: 1,
    });
    timerContainer.add(timerLabel);

    this.timerText = this.add.text(12, 20, '30.0s', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '18px',
      color: '#F4EBDD',
      fontStyle: '800',
    });
    timerContainer.add(this.timerText);

    // Timer Progress Bar across top
    this.timerBar = this.add.graphics();
    this.updateTimerBar(1);

    // Score display (Right side)
    const scoreContainer = this.add.container(GAME_WIDTH - 165, hudY);
    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x1a152e, 0.85);
    scoreBg.fillRoundedRect(0, 0, 140, 48, 12);
    scoreBg.lineStyle(1.5, COLOR_PALETTE.warmGold, 0.4);
    scoreBg.strokeRoundedRect(0, 0, 140, 48, 12);
    scoreContainer.add(scoreBg);

    const scoreLabel = this.add.text(12, 8, 'SCORE', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '10px',
      color: '#D7AD66',
      fontStyle: '700',
      letterSpacing: 1,
    });
    scoreContainer.add(scoreLabel);

    this.scoreText = this.add.text(12, 20, '0', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '20px',
      color: '#F4EBDD',
      fontStyle: '900',
    });
    scoreContainer.add(this.scoreText);

    // Combo Container (Center below top HUD)
    this.comboContainer = this.add.container(GAME_WIDTH / 2, 115);
    this.comboContainer.setAlpha(0);

    const comboBg = this.add.graphics();
    comboBg.fillStyle(0x28193a, 0.9);
    comboBg.fillRoundedRect(-80, -14, 160, 28, 14);
    comboBg.lineStyle(1.5, COLOR_PALETTE.warmGold, 0.7);
    comboBg.strokeRoundedRect(-80, -14, 160, 28, 14);
    this.comboContainer.add(comboBg);

    this.comboText = this.add.text(0, 0, 'COMBO x5!', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '13px',
      color: '#FFE29A',
      fontStyle: '800',
      letterSpacing: 1,
    }).setOrigin(0.5);
    this.comboContainer.add(this.comboText);

    // Frenzy Banner (hidden until 20s)
    this.frenzyBanner = this.add.container(GAME_WIDTH / 2, 148);
    this.frenzyBanner.setAlpha(0);
    const fText = this.add.text(0, 0, '⚡ MIDNIGHT FRENZY! ⚡', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '12px',
      color: '#FF6B8B',
      fontStyle: '900',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.frenzyBanner.add(fText);
  }

  private updateTimerBar(ratio: number): void {
    this.timerBar.clear();
    const barWidth = GAME_WIDTH - 50;
    const barHeight = 4;
    const barX = 25;
    const barY = 90;

    // Track
    this.timerBar.fillStyle(0x221a3a, 0.8);
    this.timerBar.fillRoundedRect(barX, barY, barWidth, barHeight, 2);

    // Active
    const barColor = ratio < 0.25 ? 0xc76e7e : COLOR_PALETTE.spiritCyan;
    this.timerBar.fillStyle(barColor, 1);
    this.timerBar.fillRoundedRect(barX, barY, Math.max(0, barWidth * ratio), barHeight, 2);
  }

  private showRoundStartBanner(): void {
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'CATCH!', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '48px',
      color: '#58C9ED',
      fontStyle: '900',
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: banner,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => {
        banner.destroy();
      },
    });
  }

  update(_time: number, delta: number): void {
    if (this.isRoundOver) return;

    // 1. Check if 30 seconds completed
    if (this.clock.isFinished()) {
      this.handleRoundFinish();
      return;
    }

    // 2. Update countdown HUD
    const remainingMs = this.clock.getRemainingMs();
    const remainingSecFormatted = (remainingMs / 1000).toFixed(1);
    this.timerText.setText(`${remainingSecFormatted}s`);
    this.updateTimerBar(remainingMs / ROUND_DURATION_MS);

    // 3. Check Midnight Frenzy tier (20s - 30s)
    const elapsedSec = this.clock.getElapsedMs() / 1000;
    if (elapsedSec >= 20 && !this.frenzyTriggered) {
      this.triggerMidnightFrenzy();
    }

    // 4. Update spawn manager
    this.spawnManager.update(delta);
  }

  private triggerMidnightFrenzy(): void {
    this.frenzyTriggered = true;
    this.updateMoonColor(true);

    // Play resonant Korean temple bell gong
    AudioService.getInstance().playFrenzyGong();

    // Flash frenzy banner
    this.tweens.add({
      targets: this.frenzyBanner,
      alpha: 1,
      y: 142,
      duration: 350,
      yoyo: true,
      repeat: 2,
      ease: 'Quad.easeInOut',
    });

    // Screen flash
    const flash = this.add.graphics();
    flash.fillStyle(0xc76e7e, 0.2);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
  }

  private handleTargetHit(
    _targetId: string,
    type: TargetType,
    points: number,
    x: number,
    y: number
  ): void {
    const result = this.scoreTracker.registerHit(type, points);

    // Play sound effect matching the caught spirit
    AudioService.getInstance().playCatch(type);

    // Update score text
    this.scoreText.setText(`${result.newScore}`);

    // Pop scale on score text
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Spawn floating score indicator at target position
    this.spawnFloatingScore(x, y, result.totalPoints, result.isComboBonus, type);

    // Update combo streak display
    this.updateComboDisplay(result.currentStreak, result.isComboBonus);
  }

  private handleTargetExpire(): void {
    this.scoreTracker.registerMiss();
  }

  private spawnFloatingScore(
    x: number,
    y: number,
    points: number,
    isCombo: boolean,
    type: TargetType
  ): void {
    let text = points > 0 ? `+${points}` : `${points}`;
    let color = '#58C9ED';

    if (points < 0) {
      color = '#FF6B8B'; // Hazard crimson
    } else if (type === TargetType.GOLDEN || type === TargetType.ANCIENT) {
      color = '#FFE29A'; // Gold
    }

    if (isCombo) {
      text += ' COMBO!';
      color = '#FFD700';
    }

    const popup = this.add.text(x, y - 10, text, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: isCombo ? '22px' : '18px',
      color,
      fontStyle: '900',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 55,
      alpha: 0,
      scaleX: isCombo ? 1.3 : 1.1,
      scaleY: isCombo ? 1.3 : 1.1,
      duration: 550,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  private updateComboDisplay(streak: number, isComboBonus: boolean): void {
    if (streak >= 3) {
      this.comboText.setText(`STREAK x${streak}`);
      this.comboContainer.setAlpha(1);

      if (isComboBonus) {
        AudioService.getInstance().playComboBonus();
        this.comboText.setText(`COMBO BONUS! x${streak}`);
        this.tweens.add({
          targets: this.comboContainer,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 120,
          yoyo: true,
        });
      }
    } else {
      this.comboContainer.setAlpha(0);
    }
  }

  private handleRoundFinish(): void {
    this.isRoundOver = true;

    // Capture taps BEFORE clearing — clearAll used to wipe recordedEvents (scores always synced as 0)
    const recordedEvents = this.spawnManager.getRecordedEvents();
    this.spawnManager.clearActiveTargets();

    // Play round finish sound
    AudioService.getInstance().playTimeUp();

    // Persist score if new personal best
    const isNewBest = this.scoreTracker.saveScoreIfBest();

    // Big TIME'S UP announcement
    const timeUpText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "TIME'S UP!", {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '44px',
      color: '#D7AD66',
      fontStyle: '900',
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: timeUpText,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 700,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        // Transition to GameOverScene
        this.scene.start('GameOverScene', {
          score: this.scoreTracker.getScore(),
          stats: this.scoreTracker.getStats(),
          isNewBest,
          recordedEvents,
          serverSessionId: this.serverSessionId,
        });
      },
    });
  }

  private setupLifecycleHandlers(): void {
    const onVisibilityChange = () => {
      if (document.hidden) {
        this.clock.pause();
      } else {
        this.clock.resume();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    this.events.once('shutdown', () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.spawnManager.clearAll();
      this.clock.reset();
    });
  }
}
