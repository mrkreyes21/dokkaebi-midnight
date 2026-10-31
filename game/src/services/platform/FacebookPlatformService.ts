import { IPlatformService, PlayerProfile, ShareOptions } from './IPlatformService.js';
import { STORAGE_KEYS } from '../../config/constants.js';

// Minimal type declaration for window.FBInstant
declare global {
  interface Window {
    FBInstant?: {
      initializeAsync(): Promise<void>;
      setLoadingProgress(percentage: number): void;
      startGameAsync(): Promise<void>;
      player: {
        getID(): string;
        getName(): string;
        getPhoto(): string;
        getSignedPlayerInfoAsync(requestPayload?: string): Promise<{
          getSignature(): string;
        }>;
      };
      shareAsync(payload: {
        intent: string;
        text: string;
        image: string;
        data?: Record<string, unknown>;
      }): Promise<void>;
    };
  }
}

export class FacebookPlatformService implements IPlatformService {
  readonly isFacebookInstant = true;

  async initialize(): Promise<void> {
    if (window.FBInstant) {
      await window.FBInstant.initializeAsync();
    }
  }

  setLoadingProgress(percentage: number): void {
    if (window.FBInstant) {
      window.FBInstant.setLoadingProgress(percentage);
    }
  }

  async startGame(): Promise<void> {
    if (window.FBInstant) {
      await window.FBInstant.startGameAsync();
    }
  }

  getPlayer(): PlayerProfile {
    if (window.FBInstant) {
      return {
        id: window.FBInstant.player.getID() || 'fb-player',
        name: window.FBInstant.player.getName() || 'Dokkaebi Hunter',
        photoUrl: window.FBInstant.player.getPhoto(),
      };
    }
    return { id: 'fb-unknown', name: 'Hunter' };
  }

  async getSignedPlayerInfo(requestPayload?: string): Promise<string | null> {
    if (window.FBInstant) {
      try {
        const result = await window.FBInstant.player.getSignedPlayerInfoAsync(requestPayload);
        return result.getSignature();
      } catch (err) {
        console.error('[FacebookPlatform] Failed to get signed player info:', err);
        return null;
      }
    }
    return null;
  }

  async share(options: ShareOptions): Promise<boolean> {
    if (window.FBInstant) {
      try {
        await window.FBInstant.shareAsync({
          intent: options.intent,
          text: options.text,
          image: options.image,
          data: options.data,
        });
        return true;
      } catch (err) {
        console.warn('[FacebookPlatform] Share cancelled or failed:', err);
        return false;
      }
    }
    return false;
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
      console.warn('[FacebookPlatform] Failed to save best score:', err);
    }
  }
}
