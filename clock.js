import { DebugView } from "./debug_view.js";
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
        this._timeScale = 1.0;
        this._timestamp = new Timestamp(performance.now());
        this._wallTime = new Timestamp(performance.now());
    }
    get() {
        return this._timestamp;
    }
    pause() {
        this._timeScale = 0.0;
    }
    unpause() {
        this._timeScale = 1.0;
    }
    isPaused() {
        return this._timeScale === 0.0;
    }
    update() {
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
    secondsAgo(seconds) {
        return new Timestamp(this._timestamp.milliseconds - (seconds * 1000.0));
    }
}
//# sourceMappingURL=clock.js.map