import Phaser from 'phaser';
import { TargetInteractionEvent } from '@dokkaebi/shared';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_PALETTE } from '../config/constants.js';
import { getPlatformService } from '../services/platform/PlatformManager.js';
import { ShareCardService } from '../services/ShareCardService.js';
import { AudioService } from '../services/AudioService.js';
import { ApiService } from '../services/ApiService.js';

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
  serverSessionId?: string | null;
}

export class GameOverScene extends Phaser.Scene {
  private roundData!: GameOverData;
  private shareStatusText!: Phaser.GameObjects.Text;
  private leaderboardContainer!: Phaser.GameObjects.Container;

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

    const serverStatusText = this.add.text(GAME_WIDTH / 2, cardY + 30, '', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '11px',
      color: '#8BE4FF',
      fontStyle: '600',
    }).setOrigin(0.5);

    if (this.roundData.serverSessionId) {
      serverStatusText.setText('Validating with Server...');
      platform.getSignedPlayerInfo().then((signedInfo) => {
        ApiService.finishSession(
          this.roundData.serverSessionId!,
          this.roundData.recordedEvents,
          this.roundData.score,
          signedInfo
        ).then((res) => {
          if (res?.accepted) {
            serverStatusText.setText(`✓ Verified · Server score ${res.score}`);
            serverStatusText.setColor('#3BE0B8');
            scoreDisplay.setText(`${res.score}`);
            // Refresh leaderboard after a successful commit
            this.fetchAndRenderLeaderboard(345, player.name, res.score, res.personalBest);
          } else if (res?.validationError) {
            serverStatusText.setText(`⚠ ${res.validationError}`);
            serverStatusText.setColor('#FF6B8B');
          } else if (!res) {
            serverStatusText.setText('⚠ Server unreachable — local score only');
            serverStatusText.setColor('#FF6B8B');
          }
        });
      });
    } else {
      serverStatusText.setText('Offline mode — score not synced');
      serverStatusText.setColor('#9F99B2');
    }

    if (this.roundData.isNewBest) {
      AudioService.getInstance().playNewBestFanfare();
      const newBestTag = this.add.text(GAME_WIDTH / 2, cardY + 52, '★ NEW PERSONAL BEST! ★', {
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
      this.add.text(GAME_WIDTH / 2, cardY + 50, `Personal Best: ${bestScore} pts`, {
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

    // 5. Leaderboard Section (Top 10) — fetched from backend
    this.leaderboardContainer = this.add.container(0, 0);
    this.renderLeaderboardLoading(345);
    this.fetchAndRenderLeaderboard(345, player.name, this.roundData.score, bestScore);

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

  private renderLeaderboardLoading(topY: number): void {
    this.leaderboardContainer.removeAll(true);
    const boardWidth = GAME_WIDTH - 70;
    const boardHeight = 440;
    const boardX = 35;

    const bg = this.add.graphics();
    bg.fillStyle(0x130e24, 0.92);
    bg.fillRoundedRect(boardX, topY, boardWidth, boardHeight, 14);
    bg.lineStyle(1.5, 0xd7ad66, 0.3);
    bg.strokeRoundedRect(boardX, topY, boardWidth, boardHeight, 14);
    this.leaderboardContainer.add(bg);

    const title = this.add.text(GAME_WIDTH / 2, topY + 24, 'TOP 10 SPIRIT HUNTERS', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '14px',
      color: '#D7AD66',
      fontStyle: '800',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.leaderboardContainer.add(title);

    const loading = this.add.text(GAME_WIDTH / 2, topY + boardHeight / 2, 'Loading rankings...', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '13px',
      color: '#9F99B2',
      fontStyle: '600',
    }).setOrigin(0.5);
    this.leaderboardContainer.add(loading);

    this.tweens.add({
      targets: loading,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private async fetchAndRenderLeaderboard(
    topY: number,
    playerName: string,
    currentScore: number,
    bestScore: number
  ): Promise<void> {
    try {
      const platform = getPlatformService();
      const signedInfo = await platform.getSignedPlayerInfo().catch(() => null);
      const data = await ApiService.getLeaderboard(signedInfo);

      if (!this.scene.isActive('GameOverScene')) return; // Scene may have been left

      if (data) {
        // Empty topScores is a valid response (no verified scores yet) — not an outage
        this.renderLeaderboardData(
          topY,
          data.topScores,
          data.playerEntry ?? null,
          playerName,
          currentScore,
          bestScore
        );
      } else {
        this.renderLeaderboardOffline(topY, playerName, currentScore, bestScore);
      }
    } catch {
      if (this.scene.isActive('GameOverScene')) {
        this.renderLeaderboardOffline(topY, playerName, currentScore, bestScore);
      }
    }
  }

  private renderLeaderboardData(
    topY: number,
    topScores: Array<{ rank: number; playerId: string; displayName: string; score: number; achievedAt: string }>,
    playerEntry: { rank: number; playerId: string; displayName: string; score: number } | null,
    _playerName: string,
    _currentScore: number,
    _bestScore: number
  ): void {
    this.leaderboardContainer.removeAll(true);
    const boardWidth = GAME_WIDTH - 70;
    const boardHeight = 440;
    const boardX = 35;

    const bg = this.add.graphics();
    bg.fillStyle(0x130e24, 0.92);
    bg.fillRoundedRect(boardX, topY, boardWidth, boardHeight, 14);
    bg.lineStyle(1.5, 0xd7ad66, 0.3);
    bg.strokeRoundedRect(boardX, topY, boardWidth, boardHeight, 14);
    this.leaderboardContainer.add(bg);

    const title = this.add.text(GAME_WIDTH / 2, topY + 24, 'TOP 10 SPIRIT HUNTERS', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '14px',
      color: '#D7AD66',
      fontStyle: '800',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.leaderboardContainer.add(title);

    const rowStartY = topY + 56;
    const rowHeight = 36;
    const currentPlayerId = playerEntry?.playerId;

    if (topScores.length === 0) {
      const empty = this.add.text(
        GAME_WIDTH / 2,
        topY + 120,
        'No verified scores yet — be the first!',
        {
          fontFamily: '"Outfit", sans-serif',
          fontSize: '13px',
          color: '#9F99B2',
          fontStyle: '600',
        }
      ).setOrigin(0.5);
      this.leaderboardContainer.add(empty);
    }

    for (let i = 0; i < Math.min(10, topScores.length); i++) {
      const entry = topScores[i];
      const rowY = rowStartY + i * rowHeight;
      const isPlayer = entry.playerId === currentPlayerId;

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
      this.leaderboardContainer.add(rowBg);

      let rankColor = '#9F99B2';
      if (entry.rank === 1) rankColor = '#FFD700';
      if (entry.rank === 2) rankColor = '#E0E0E0';
      if (entry.rank === 3) rankColor = '#CD7F32';

      const rankTxt = this.add.text(boardX + 22, rowY + 12, `#${entry.rank}`, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: rankColor,
        fontStyle: '800',
      }).setOrigin(0, 0.5);
      this.leaderboardContainer.add(rankTxt);

      const nameTxt = this.add.text(boardX + 68, rowY + 12, entry.displayName, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: isPlayer ? '#FFE29A' : '#F4EBDD',
        fontStyle: isPlayer ? '800' : '500',
      }).setOrigin(0, 0.5);
      this.leaderboardContainer.add(nameTxt);

      const scoreTxt = this.add.text(boardX + boardWidth - 24, rowY + 12, `${entry.score} pts`, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: '#58C9ED',
        fontStyle: '700',
      }).setOrigin(1, 0.5);
      this.leaderboardContainer.add(scoreTxt);
    }

    // If player is not in top 10, show their rank below
    if (playerEntry && !topScores.find((e) => e.playerId === currentPlayerId)) {
      const sep = this.add.text(GAME_WIDTH / 2, rowStartY + 10 * rowHeight + 4, '— — —', {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '11px',
        color: '#4a4060',
      }).setOrigin(0.5);
      this.leaderboardContainer.add(sep);

      const yourRankY = rowStartY + 10 * rowHeight + 22;
      const yourBg = this.add.graphics();
      yourBg.fillStyle(0x2d214f, 0.95);
      yourBg.fillRoundedRect(boardX + 8, yourRankY - 4, boardWidth - 16, rowHeight - 4, 6);
      yourBg.lineStyle(1, COLOR_PALETTE.warmGold, 0.7);
      yourBg.strokeRoundedRect(boardX + 8, yourRankY - 4, boardWidth - 16, rowHeight - 4, 6);
      this.leaderboardContainer.add(yourBg);

      const yourRank = this.add.text(boardX + 22, yourRankY + 12, `#${playerEntry.rank}`, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: '#9F99B2',
        fontStyle: '800',
      }).setOrigin(0, 0.5);
      this.leaderboardContainer.add(yourRank);

      const yourName = this.add.text(boardX + 68, yourRankY + 12, `${playerEntry.displayName} (you)`, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: '#FFE29A',
        fontStyle: '800',
      }).setOrigin(0, 0.5);
      this.leaderboardContainer.add(yourName);

      const yourScore = this.add.text(boardX + boardWidth - 24, yourRankY + 12, `${playerEntry.score} pts`, {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '13px',
        color: '#58C9ED',
        fontStyle: '700',
      }).setOrigin(1, 0.5);
      this.leaderboardContainer.add(yourScore);
    }
  }

  private renderLeaderboardOffline(
    topY: number,
    playerName: string,
    currentScore: number,
    bestScore: number
  ): void {
    this.leaderboardContainer.removeAll(true);
    const boardWidth = GAME_WIDTH - 70;
    const boardHeight = 440;
    const boardX = 35;

    const bg = this.add.graphics();
    bg.fillStyle(0x130e24, 0.92);
    bg.fillRoundedRect(boardX, topY, boardWidth, boardHeight, 14);
    bg.lineStyle(1.5, 0xd7ad66, 0.3);
    bg.strokeRoundedRect(boardX, topY, boardWidth, boardHeight, 14);
    this.leaderboardContainer.add(bg);

    const title = this.add.text(GAME_WIDTH / 2, topY + 24, 'TOP 10 SPIRIT HUNTERS', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '14px',
      color: '#D7AD66',
      fontStyle: '800',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.leaderboardContainer.add(title);

    const offlineNote = this.add.text(GAME_WIDTH / 2, topY + 55, 'Server unavailable — scores not synced', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '11px',
      color: '#6a6485',
      fontStyle: '600',
    }).setOrigin(0.5);
    this.leaderboardContainer.add(offlineNote);

    // Show local best as the only entry
    const rowY = topY + 85;
    const isNewBest = currentScore >= bestScore;
    const displayScore = Math.max(currentScore, bestScore);

    const rowBg = this.add.graphics();
    rowBg.fillStyle(0x2d214f, 0.95);
    rowBg.fillRoundedRect(boardX + 8, rowY - 4, boardWidth - 16, 32, 6);
    rowBg.lineStyle(1, COLOR_PALETTE.warmGold, 0.7);
    rowBg.strokeRoundedRect(boardX + 8, rowY - 4, boardWidth - 16, 32, 6);
    this.leaderboardContainer.add(rowBg);

    const youTxt = this.add.text(boardX + 22, rowY + 12, `YOU`, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '13px',
      color: '#FFD700',
      fontStyle: '800',
    }).setOrigin(0, 0.5);
    this.leaderboardContainer.add(youTxt);

    const nameTxt = this.add.text(boardX + 68, rowY + 12, playerName, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '13px',
      color: '#FFE29A',
      fontStyle: '800',
    }).setOrigin(0, 0.5);
    this.leaderboardContainer.add(nameTxt);

    const scoreTxt = this.add.text(boardX + boardWidth - 24, rowY + 12, `${displayScore} pts${isNewBest ? ' ★' : ''}`, {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '13px',
      color: '#58C9ED',
      fontStyle: '700',
    }).setOrigin(1, 0.5);
    this.leaderboardContainer.add(scoreTxt);
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
      AudioService.getInstance().playButtonClick();
    });

    container.on('pointerup', () => {
      container.setScale(1);
      onClick();
    });

    return container;
  }
}
