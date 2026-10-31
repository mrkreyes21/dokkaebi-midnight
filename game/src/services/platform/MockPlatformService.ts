import { IPlatformService, PlayerProfile, ShareOptions } from './IPlatformService.js';
import { STORAGE_KEYS } from '../../config/constants.js';

export class MockPlatformService implements IPlatformService {
  readonly isFacebookInstant = false;
  private player: PlayerProfile;

  constructor() {
    this.player = {
      id: 'mock-player-local',
      name: 'Night Hunter (Dev)',
    };
  }

  async initialize(): Promise<void> {
    console.log('[MockPlatform] Initialized');
  }

  setLoadingProgress(percentage: number): void {
    console.log(`[MockPlatform] Loading progress: ${Math.round(percentage)}%`);
  }

  async startGame(): Promise<void> {
    console.log('[MockPlatform] Game started');
  }

  getPlayer(): PlayerProfile {
    return this.player;
  }

  async getSignedPlayerInfo(requestPayload?: string): Promise<string | null> {
    // For local dev, return a mock signed info string if needed
    console.log('[MockPlatform] getSignedPlayerInfo called with payload:', requestPayload);
    return null;
  }

  async share(options: ShareOptions): Promise<boolean> {
    console.log('[MockPlatform] Share triggered with options:', {
      intent: options.intent,
      text: options.text,
      hasImage: !!options.image,
    });
    // In local dev, we can pop up a simulated share confirmation or download
    return true;
  }

  getBestScore(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BEST_SCORE);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  saveBestScore(score: number): void {
    try {
      const current = this.getBestScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEYS.BEST_SCORE, score.toString());
      }
    } catch (err) {
      console.warn('[MockPlatform] Failed to persist score to localStorage:', err);
    }
  }
}
