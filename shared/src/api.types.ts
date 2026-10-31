import { TargetInteractionEvent } from './game.types.js';

export interface CreateSessionRequest {
  signedPlayerInfo?: string;
  devPlayerId?: string;
  devPlayerName?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  seed: string;
  startedAt: string;
  expiresAt: string;
  gameConfigVersion: number;
}

export interface FinishSessionRequest {
  events: TargetInteractionEvent[];
  clientScore?: number; // Reported for diagnostic comparison only; not trusted
}

export interface FinishSessionResponse {
  accepted: boolean;
  score: number;
  personalBest: number;
  isNewBest: boolean;
  validationError?: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  achievedAt: string;
}

export interface LeaderboardResponse {
  topScores: LeaderboardEntry[];
  playerEntry?: LeaderboardEntry | null;
}

export interface PlayerProfileResponse {
  id: string;
  displayName: string;
  bestScore: number;
  rank?: number | null;
}
