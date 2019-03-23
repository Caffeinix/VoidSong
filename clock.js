export class Timestamp {
    constructor(milliseconds) {
        this.milliseconds = milliseconds;
    }
    get seconds() {
        return this.milliseconds / 1000.0;
    }
}
export class Clock {
    constructor() {
        this._timestamp = new Timestamp(performance.now());
        this._paused = false;
    }
    get() {
        return this._timestamp;
    }
    pause() {
        this._paused = true;
    }
    unpause() {
        this._paused = false;
    }
    update() {
        const now = performance.now();
        const step = (now - this._timestamp.milliseconds) / 1000.0;
        this._timestamp = new Timestamp(now);
        if (this._paused) {
            return 0;
        }
        else {
            return step;
        }
    }
    secondsAgo(seconds) {
        return new Timestamp(this._timestamp.milliseconds - (seconds * 1000.0));
    }
}
//# sourceMappingURL=clock.js.map