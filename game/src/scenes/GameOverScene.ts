import Phaser from 'phaser';
import { TargetInteractionEvent } from '@dokkaebi/shared';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_PALETTE } from '../config/constants.js';
import { getPlatformService } from '../services/platform/PlatformManager.js';
import { ShareCardService } from '../services/ShareCardService.js';

interface GameOverData {
  score: number;
  stats: {
    score: number;
    positiveHits: number;
    hazardHits: number;
    missedCount: number;
    maxCombo: number;
    initialBestScore: number;
    isNewBest: boolean;
  };
  isNewBest: boolean;
  recordedEvents: TargetInteractionEvent[];
}

export class GameOverScene extends Phaser.Scene {
  private roundData!: GameOverData;
  private shareStatusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.roundData = data || {
      score: 0,
      stats: {
        score: 0,
        positiveHits: 0,
        hazardHits: 0,
        missedCount: 0,
        maxCombo: 0,
        initialBestScore: 0,
        isNewBest: false,
      },
      isNewBest: false,
      recordedEvents: [],
    };
  }

  create(): void {
    const platform = getPlatformService();
    const player = platform.getPlayer();
    const bestScore = platform.getBestScore();

    // 1. Deep night background
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      COLOR_PALETTE.bgNightNavy,
      COLOR_PALETTE.bgNightNavy,
      COLOR_PALETTE.bgMidnightPlum,
      COLOR_PALETTE.bgMidnightPlum,
      1
    );
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Header
    this.add.text(GAME_WIDTH / 2, 60, 'ROUND OVER', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '24px',
      color: '#F4EBDD',
      fontStyle: '800',
      letterSpacing: 3,
    }).setOrigin(0.5);

    // 3. Score Showcase Card
    const cardY = 175;
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x1a152e, 0.9);
    cardBg.fillRoundedRect(35, cardY - 80, GAME_WIDTH - 70, 160, 16);
    cardBg.lineStyle(2, this.roundData.isNewBest ? 0xffd700 : COLOR_PALETTE.warmGold, 0.6);
    cardBg.strokeRoundedRect(35, cardY - 80, GAME_WIDTH - 70, 160, 16);

    this.add.text(GAME_WIDTH / 2, cardY - 50, 'FINAL SCORE', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '13px',
      color: '#9F99B2',
      fontStyle: '700',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const scoreDisplay = this.add.text(GAME_WIDTH / 2, cardY, `${this.roundData.score}`, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '56px',
      color: '#58C9ED',
      fontStyle: '900',
    }).setOrigin(0.5);

    // Pop animation on score
    this.tweens.add({
      targets: scoreDisplay,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 350,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    if (this.roundData.isNewBest) {
      const newBestTag = this.add.text(GAME_WIDTH / 2, cardY + 50, '★ NEW PERSONAL BEST! ★', {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '14px',
        color: '#FFD700',
        fontStyle: '800',
        letterSpacing: 1,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newBestTag,
        alpha: 0.6,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.add.text(GAME_WIDTH / 2, cardY + 48, `Personal Best: ${bestScore} pts`, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: '#D7AD66',
        fontStyle: '600',
      }).setOrigin(0.5);
    }

    // 4. Stats Mini-Grid
    const statsY = 285;
    this.createStatBadge(100, statsY, 'Spirits Caught', `${this.roundData.stats.positiveHits}`);
    this.createStatBadge(270, statsY, 'Cursed Traps', `${this.roundData.stats.hazardHits}`);
    this.createStatBadge(440, statsY, 'Max Streak', `${this.roundData.stats.maxCombo}`);

    // 5. Leaderboard Section (Top 10)
    this.createLeaderboardSection(345, player.name, this.roundData.score, bestScore);

    // 6. Action Buttons at Bottom
    const btnY = 875;

    // Play Again Button (Large & Primary)
    this.createButton(
      145,
      btnY,
      190,
      54,
      'PLAY AGAIN',
      COLOR_PALETTE.warmGold,
      0x171326,
      () => {
        this.scene.start('GameScene');
      }
    );

    // Share Button
    this.createButton(
      355,
      btnY,
      170,
      54,
      'SHARE ↗',
      COLOR_PALETTE.spiritCyan,
      0x171326,
      () => {
        this.handleShare(player.name, bestScore);
      }
    );

    // Share status toast feedback
    this.shareStatusText = this.add.text(GAME_WIDTH / 2, btnY - 42, '', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '12px',
      color: '#58C9ED',
      fontStyle: '700',
    }).setOrigin(0.5);
  }

  private createStatBadge(x: number, y: number, label: string, value: string): void {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a152e, 0.7);
    bg.fillRoundedRect(-65, -25, 130, 50, 10);
    bg.lineStyle(1, 0x58c9ed, 0.2);
    bg.strokeRoundedRect(-65, -25, 130, 50, 10);
    container.add(bg);

    const valText = this.add.text(0, -6, value, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '18px',
      color: '#F4EBDD',
      fontStyle: '800',
    }).setOrigin(0.5);
    container.add(valText);

    const lblText = this.add.text(0, 12, label, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '10px',
      color: '#9F99B2',
      fontStyle: '600',
    }).setOrigin(0.5);
    container.add(lblText);
  }

  private createLeaderboardSection(
    topY: number,
    playerName: string,
    currentScore: number,
    bestScore: number
  ): void {
    const boardWidth = GAME_WIDTH - 70;
    const boardHeight = 440;
    const boardX = 35;

    const bg = this.add.graphics();
    bg.fillStyle(0x130e24, 0.92);
    bg.fillRoundedRect(boardX, topY, boardWidth, boardHeight, 14);
    bg.lineStyle(1.5, 0xd7ad66, 0.3);
    bg.strokeRoundedRect(boardX, topY, boardWidth, boardHeight, 14);

    this.add.text(GAME_WIDTH / 2, topY + 24, 'TOP 10 SPIRIT HUNTERS', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '14px',
      color: '#D7AD66',
      fontStyle: '800',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Initial mock leaderboard entries (Phase 1 local preview; replaced by backend in Phase 3)
    const mockScores = [
      { rank: 1, name: 'MoonWalker', score: 68 },
      { rank: 2, name: 'DokkaebiMaster', score: 54 },
      { rank: 3, name: 'HanokGhost', score: 47 },
      { rank: 4, name: 'NightSeeker', score: 39 },
      { rank: 5, name: playerName, score: Math.max(currentScore, bestScore), isCurrent: true },
      { rank: 6, name: 'FireflyFox', score: 28 },
      { rank: 7, name: 'ShadowTapper', score: 24 },
      { rank: 8, name: 'LotusSpirit', score: 19 },
      { rank: 9, name: 'CobaltSprite', score: 15 },
      { rank: 10, name: 'VillageWanderer', score: 11 },
    ];

    // Sort mock data dynamically so current score reflects properly
    mockScores.sort((a, b) => b.score - a.score);
    mockScores.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const rowStartY = topY + 56;
    const rowHeight = 36;

    for (let i = 0; i < Math.min(10, mockScores.length); i++) {
      const entry = mockScores[i];
      const rowY = rowStartY + i * rowHeight;
      const isPlayer = entry.isCurrent;

      const rowBg = this.add.graphics();
      if (isPlayer) {
        rowBg.fillStyle(0x2d214f, 0.95);
        rowBg.fillRoundedRect(boardX + 8, rowY - 4, boardWidth - 16, rowHeight - 4, 6);
        rowBg.lineStyle(1, COLOR_PALETTE.warmGold, 0.7);
        rowBg.strokeRoundedRect(boardX + 8, rowY - 4, boardWidth - 16, rowHeight - 4, 6);
      } else if (i % 2 === 1) {
        rowBg.fillStyle(0x18132c, 0.5);
        rowBg.fillRoundedRect(boardX + 8, rowY - 4, boardWidth - 16, rowHeight - 4, 6);
      }

      // Rank icon or text
      let rankColor = '#9F99B2';
      if (entry.rank === 1) rankColor = '#FFD700';
      if (entry.rank === 2) rankColor = '#E0E0E0';
      if (entry.rank === 3) rankColor = '#CD7F32';

      this.add.text(boardX + 22, rowY + 12, `#${entry.rank}`, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: rankColor,
        fontStyle: '800',
      }).setOrigin(0, 0.5);

      // Name
      this.add.text(boardX + 68, rowY + 12, entry.name, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: isPlayer ? '#FFE29A' : '#F4EBDD',
        fontStyle: isPlayer ? '800' : '500',
      }).setOrigin(0, 0.5);

      // Score
      this.add.text(boardX + boardWidth - 24, rowY + 12, `${entry.score} pts`, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: '#58C9ED',
        fontStyle: '700',
      }).setOrigin(1, 0.5);
    }
  }

  private async handleShare(playerName: string, bestScore: number): Promise<void> {
    const platform = getPlatformService();
    this.shareStatusText.setText('Generating share card...');

    try {
      const cardBase64 = ShareCardService.generateCard({
        score: this.roundData.score,
        bestScore,
        playerName,
      });

      const shared = await platform.share({
        intent: 'CHALLENGE',
        text: `I caught ${this.roundData.score} Dokkaebi spirits in 30 seconds! Can you beat me?`,
        image: cardBase64,
        data: { score: this.roundData.score },
      });

      if (shared) {
        this.shareStatusText.setText('✓ Share dialog ready!');
        this.shareStatusText.setColor('#58C9ED');
      } else {
        this.shareStatusText.setText('Share completed.');
      }
    } catch (err) {
      console.warn('[GameOverScene] Share failed:', err);
      this.shareStatusText.setText('Share unavailable in this environment.');
    }
  }

  private createButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    bgColor: number,
    _textColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(2, 0xffffff, 0.35);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    container.add(bg);

    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '16px',
      color: '#171326',
      fontStyle: '900',
      letterSpacing: 1.5,
    }).setOrigin(0.5);
    container.add(txt);

    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      container.setScale(0.95);
    });

    container.on('pointerup', () => {
      container.setScale(1);
      onClick();
    });

    return container;
  }
}
