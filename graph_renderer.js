import { DebugView } from './operations/debug_view.js';
export class GraphRenderer {
    constructor(selector, maxSelector, width, height) {
        this.duration = 30.0;
        /**
         * The canvas element.
         */
        this._canvas = document.createElement('canvas');
        this._history = [];
        this._selector = selector;
        this._maxSelector = maxSelector;
        this._canvas.classList.add('graph');
        this._canvas.style.width = width + 'px';
        this._canvas.style.height = height + 'px';
        this._canvas.width = width * window.devicePixelRatio;
        this._canvas.height = height * window.devicePixelRatio;
        document.body.appendChild(this._canvas);
    }
    render(world, computer, clock) {
        this._history.push([clock.get().seconds, this.querySelector(world, this._selector) || 0]);
        while (this._history[0][0] < clock.get().seconds - this.duration) {
            this._history.shift();
        }
        const maxValue = this._maxSelector ? this.querySelector(world, this._maxSelector) || 0
            : Math.max(...this._history.map((entry) => entry[1]));
        // Normalized so that x is on [0, duration] and y is on [0, canvas.height].
        const normalizedHistory = this._history.map((value) => {
            const x = (value[0] - this._history[0][0]) * this._canvas.width / this.duration;
            const y = value[1] / maxValue * this._canvas.height;
            return [x, y];
        });
        const ctx = this._canvas.getContext('2d');
        ctx.save();
        ctx.fillStyle = '#101012';
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
        ctx.transform(1, 0, 0, -1, 0, this._canvas.height); // Flip y to cartesian coordinates.
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
    querySelector(world, selector) {
        const pathComponents = selector.split('.');
        let context = world;
        for (const component of pathComponents) {
            if (/\[.*\]/.test(component)) {
                const results = /\[(\w+)(?:\s*=\s*(\w+))]/.exec(component);
                if (results) {
                    const [_, property, expectedValue] = results;
                    context = Object.values(context).find((value) => value[property].toString() === expectedValue);
                }
                else {
                    DebugView.getView('graph-renderer').textContent =
                        `${component} is not a valid query`;
                    return null;
                }
            }
            else if (component === ':player-ship') {
                context = Object.values(context).find((value) => value.isPlayerShip && value.exists);
            }
            else {
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
        }
        else {
            DebugView.getView('graph-renderer').textContent =
                `${selector} is not a number (type is ${typeof context})`;
            return null;
        }
    }
}
//# sourceMappingURL=graph_renderer.js.map