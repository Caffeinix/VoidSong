import { DebugView } from "./debug_view.js";

export class Timestamp {
  public milliseconds: number;

  constructor(milliseconds: number) {
    this.milliseconds = milliseconds;
  }
  get seconds(): number {
    return this.milliseconds / 1000.0;
  }
}

export class Clock {
  private _timestamp: Timestamp;
  private _wallTime: Timestamp;
  private _timeScale: number = 1.0;

  constructor() {
    this._timestamp = new Timestamp(performance.now());
    this._wallTime = new Timestamp(performance.now());
  }

  public get(): Timestamp {
    return this._timestamp;
  }

  public pause() {
    this._timeScale = 0.0;
  }

  public unpause() {
    this._timeScale = 1.0;
  }

  public isPaused(): boolean {
    return this._timeScale === 0.0;
  }

  public update(): void {
    // TODO: this won't work for anything but paused and unpaused.
    // if (this._timeScale !== 0.0) {
    //   const now = performance.now();
    //   this._timestamp = new Timestamp(now);
    // }
    const elapsedWallTime = performance.now() - this._wallTime.milliseconds;
    const elapsedGameTime = elapsedWallTime * this._timeScale;
    this._wallTime = new Timestamp(performance.now());
    this._timestamp = new Timestamp(this._timestamp.milliseconds + elapsedGameTime);
    DebugView.getView('clock').textContent = `${elapsedWallTime} / ${elapsedGameTime}`;
  }

  public secondsAgo(seconds: number): Timestamp {
    return new Timestamp(this._timestamp.milliseconds - (seconds * 1000.0));
  }
}
