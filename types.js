export class WorldPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
export class WorldRect {
    constructor(left, top, width, height) {
        this.left = left || 0;
        this.top = top || 0;
        this.right = this.left + (width || 0);
        this.bottom = this.top + (height || 0);
    }
    get width() {
        return this.right - this.left;
    }
    get height() {
        return this.bottom - this.top;
    }
}
//# sourceMappingURL=types.js.map