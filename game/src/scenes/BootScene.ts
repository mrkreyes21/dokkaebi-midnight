import Phaser from 'phaser';
import { getPlatformService } from '../services/platform/PlatformManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  async create(): Promise<void> {
    const platform = getPlatformService();
    try {
      // Never block local boot if the platform adapter stalls
      await Promise.race([
        platform.initialize(),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('[BootScene] Platform initialization error:', err);
    }

    this.scene.start('PreloadScene');
  }
}
