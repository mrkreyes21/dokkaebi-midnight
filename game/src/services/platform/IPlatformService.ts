export interface PlayerProfile {
  id: string;
  name: string;
  photoUrl?: string;
}

export interface ShareOptions {
  intent: 'SHARE' | 'CHALLENGE' | 'INVITE';
  text: string;
  image: string; // Base64 data URL
  data?: Record<string, unknown>;
}

export interface IPlatformService {
  readonly isFacebookInstant: boolean;
  initialize(): Promise<void>;
  setLoadingProgress(percentage: number): void;
  startGame(): Promise<void>;
  getPlayer(): PlayerProfile;
  getSignedPlayerInfo(requestPayload?: string): Promise<string | null>;
  share(options: ShareOptions): Promise<boolean>;
  getBestScore(): number;
  saveBestScore(score: number): void;
}
