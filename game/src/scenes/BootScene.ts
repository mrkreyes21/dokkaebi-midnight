import Phaser from 'phaser';
import { getPlatformService } from '../services/platform/PlatformManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  async create(): Promise<void> {
    const platform = getPlatformService();
    try {
      await platform.initialize();
    } catch (err) {
      console.warn('[BootScene] Platform initialization error:', err);
    }

    this.scene.start('PreloadScene');
  }
}
