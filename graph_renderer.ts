import { Clock } from './clock.js';
import { DeepReadonly } from './deep_readonly.js';
import { Ship } from './model/ship.js';
import { World } from './model/world.js';
import { DebugView } from './debug_view.js';
import { ShipComputer } from './ship_computer.js';

export class GraphRenderer {
  public duration: number = 30.0;
  /**
   * The canvas element.
   */
  private readonly _canvas = document.createElement('canvas') as HTMLCanvasElement;
  private readonly _selector: string;
  private readonly _maxSelector: string | undefined;
  private _history: Array<[number, number]> = [];

  constructor(parent: HTMLElement | null, selector: string, maxSelector: string | undefined,
              width: number, height: number) {
    this._selector = selector;
    this._maxSelector = maxSelector;
    this._canvas.style.width = width + 'px';
    this._canvas.style.height = height + 'px';
    this._canvas.width = width * window.devicePixelRatio;
    this._canvas.height = height * window.devicePixelRatio;
    (parent || document.body).appendChild(this._canvas);
    this._canvas.parentElement!.classList.add('graph');
  }

  public render(world: DeepReadonly<World>, computer: ShipComputer, clock: Readonly<Clock>) {
    this._history.push([clock.get().seconds, this.querySelector(world, this._selector) || 0]);
    while (this._history[0][0] < clock.get().seconds - this.duration) {
      this._history.shift();
    }
    const maxValue =
      this._maxSelector ? this.querySelector(world, this._maxSelector) || 0
        : Math.max(...this._history.map((entry) => entry[1]));
    // Normalized so that x is on [0, duration] and y is on [0, canvas.height].
    const normalizedHistory = this._history.map(
      (value) => {
        const x = (value[0] - this._history[0][0]) * this._canvas.width / this.duration;
        const y = value[1] / maxValue * this._canvas.height;
        return [x, y];
      });

    const ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.save();
    ctx.fillStyle = '#101012';
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    ctx.transform(1, 0, 0, -1, 0, this._canvas.height);  // Flip y to cartesian coordinates.
    ctx.fillStyle = 'rgba(128, 170, 255, 0.1)';
    ctx.lineWidth = window.devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(normalizedHistory[0][0], normalizedHistory[0][1]);
    for (const [x, y] of normalizedHistory) {
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#8AF';
    ctx.stroke();
    ctx.lineTo(normalizedHistory[normalizedHistory.length - 1][0], 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // TODO: factor this out into its own utility.
  private querySelector(world: DeepReadonly<World>, selector: string): number | null {
    const pathComponents = selector.split('.');
    let context: any = world;
    for (const component of pathComponents) {
      if (/\[.*\]/.test(component)) {
        const results = /\[(\w+)(?:\s*=\s*(\w+))]/.exec(component);
        if (results) {
          const [_, property, expectedValue] = results;
          context = Object.values(context).find(
            (value) => value[property].toString() === expectedValue);
        } else {
          DebugView.getView('graph-renderer').textContent =
            `${component} is not a valid query`;
          return null;
        }
      } else if (component === ':player-ship') {
        context = Object.values(context).find(
          (value) => (value as Ship).isPlayerShip && (value as Ship).exists);
      } else {
        context = context[component];
      }
      if (context == null) {
        DebugView.getView('graph-renderer').textContent =
          `${selector} does not exist (first invalid component: ${component})`;
        return null;
      }
    }
    if (typeof context === 'number') {
      return context;
    } else {
      DebugView.getView('graph-renderer').textContent =
        `${selector} is not a number (type is ${typeof context})`;
      return null;
    }
  }
}
