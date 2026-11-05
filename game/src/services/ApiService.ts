import {
  CreateSessionResponse,
  FinishSessionResponse,
  LeaderboardResponse,
  TargetInteractionEvent,
} from '@dokkaebi/shared';

export class ApiService {
  private static baseUrl = (
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');

  private static getHeaders(signedPlayerInfo?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (signedPlayerInfo) {
      headers['x-fb-signed-player-info'] = signedPlayerInfo;
    } else {
      headers['x-dev-player-id'] = 'mock-dev-player';
      headers['x-dev-player-name'] = 'Night Hunter (Dev)';
    }
    return headers;
  }

  public static async createSession(signedPlayerInfo?: string | null): Promise<CreateSessionResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/game/sessions`, {
        method: 'POST',
        headers: this.getHeaders(signedPlayerInfo),
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        console.warn(`[ApiService] Session creation returned ${res.status}`);
        return null;
      }

      return (await res.json()) as CreateSessionResponse;
    } catch (err) {
      console.warn('[ApiService] Backend unavailable for session creation (offline mode active):', err);
      return null;
    }
  }

  public static async finishSession(
    sessionId: string,
    events: TargetInteractionEvent[],
    clientScore: number,
    signedPlayerInfo?: string | null
  ): Promise<FinishSessionResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/game/sessions/${sessionId}/finish`, {
        method: 'POST',
        headers: this.getHeaders(signedPlayerInfo),
        body: JSON.stringify({
          events,
          clientScore,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn(`[ApiService] Score submission rejected:`, errorData);
        return {
          accepted: false,
          score: 0,
          personalBest: 0,
          isNewBest: false,
          validationError: errorData.errorMessage || 'Server validation rejected session',
        };
      }

      return (await res.json()) as FinishSessionResponse;
    } catch (err) {
      console.warn('[ApiService] Backend unavailable for score submission:', err);
      return null;
    }
  }

  public static async getLeaderboard(signedPlayerInfo?: string | null): Promise<LeaderboardResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/leaderboard`, {
        method: 'GET',
        headers: this.getHeaders(signedPlayerInfo),
      });

      if (!res.ok) return null;
      return (await res.json()) as LeaderboardResponse;
    } catch (err) {
      console.warn('[ApiService] Backend leaderboard fetch failed:', err);
      return null;
    }
  }
}
