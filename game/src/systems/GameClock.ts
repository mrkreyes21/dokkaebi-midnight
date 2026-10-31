export class GameClock {
  private durationMs: number;
  private startTimestamp: number = 0;
  private isRunning: boolean = false;
  private pausedTimestamp: number = 0;
  private totalPausedMs: number = 0;

  constructor(durationMs: number = 30000) {
    this.durationMs = durationMs;
  }

  public start(): void {
    this.startTimestamp = performance.now();
    this.totalPausedMs = 0;
    this.isRunning = true;
  }

  public pause(): void {
    if (this.isRunning && this.pausedTimestamp === 0) {
      this.pausedTimestamp = performance.now();
    }
  }

  public resume(): void {
    if (this.isRunning && this.pausedTimestamp > 0) {
      this.totalPausedMs += (performance.now() - this.pausedTimestamp);
      this.pausedTimestamp = 0;
    }
  }

  public getElapsedMs(): number {
    if (!this.isRunning) return 0;
    const now = this.pausedTimestamp > 0 ? this.pausedTimestamp : performance.now();
    return Math.max(0, now - this.startTimestamp - this.totalPausedMs);
  }

  public getRemainingMs(): number {
    const elapsed = this.getElapsedMs();
    return Math.max(0, this.durationMs - elapsed);
  }

  public isFinished(): boolean {
    return this.isRunning && this.getRemainingMs() <= 0;
  }

  public getRemainingSeconds(): number {
    return Math.ceil(this.getRemainingMs() / 1000);
  }

  public getProgress(): number {
    return Math.min(1, this.getElapsedMs() / this.durationMs);
  }

  public reset(): void {
    this.startTimestamp = 0;
    this.isRunning = false;
    this.pausedTimestamp = 0;
    this.totalPausedMs = 0;
  }
}
