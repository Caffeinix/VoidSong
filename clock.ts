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
  private _paused: boolean;

  constructor() {
    this._timestamp = new Timestamp(performance.now());
    this._paused = false;
  }

  public get(): Timestamp {
    return this._timestamp;
  }

  public pause() {
    this._paused = true;
  }

  public unpause() {
    this._paused = false;
  }

  public update(): number {
    const now = performance.now();
    const step = (now - this._timestamp.milliseconds) / 1000.0;
    this._timestamp = new Timestamp(now);
    if (this._paused) {
      return 0;
    } else {
      return step;
    }
  }

  public secondsAgo(seconds: number): Timestamp {
    return new Timestamp(this._timestamp.milliseconds - (seconds * 1000.0));
  }
}
