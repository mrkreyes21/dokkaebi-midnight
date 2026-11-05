import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_PALETTE } from '../config/constants.js';
import { getPlatformService } from '../services/platform/PlatformManager.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const platform = getPlatformService();

    // Background gradient for loading screen
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      COLOR_PALETTE.bgNightNavy,
      COLOR_PALETTE.bgNightNavy,
      COLOR_PALETTE.bgMidnightPlum,
      COLOR_PALETTE.bgMidnightPlum,
      1
    );
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, '도깨비', {
      fontFamily: '"Noto Serif KR", serif',
      fontSize: '44px',
      color: '#D7AD66',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, 'DOKKAEBI', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '28px',
      color: '#F4EBDD',
      fontStyle: '800',
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.46, 'THE MIDNIGHT GAME', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '14px',
      color: '#58C9ED',
      letterSpacing: 6,
    }).setOrigin(0.5);

    // Loading bar container
    const barWidth = 260;
    const barHeight = 8;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = GAME_HEIGHT * 0.65;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x221a3a, 1);
    barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    const progressBar = this.add.graphics();

    const loadingLabel = this.add.text(GAME_WIDTH / 2, barY + 24, 'Entering the village...', {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '13px',
      color: '#9F99B2',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(COLOR_PALETTE.spiritCyan, 1);
      progressBar.fillRoundedRect(barX, barY, barWidth * value, barHeight, 4);
      platform.setLoadingProgress(value * 100);
    });

    this.load.on('complete', () => {
      loadingLabel.setText('Ready to catch spirits');
    });

    // Create programmatically generated procedural sound effects and textures if needed
    // In Phase 1 we create procedural texture fallbacks so game is 100% playable immediately
  }

  async create(): Promise<void> {
    const platform = getPlatformService();
    try {
      await Promise.race([
        platform.startGame(),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('[PreloadScene] platform.startGame error:', err);
    }

    this.scene.start('MenuScene');
  }
}
