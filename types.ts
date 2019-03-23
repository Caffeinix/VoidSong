export class WorldPoint {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class WorldRect {
  public left: number;
  public top: number;
  public right: number;
  public bottom: number;

  constructor(left?: number, top?: number, width?: number, height?: number) {
    this.left = left || 0;
    this.top = top || 0;
    this.right = this.left + (width || 0);
    this.bottom = this.top + (height || 0);
  }

  get width(): number {
    return this.right - this.left;
  }
  get height(): number {
    return this.bottom - this.top;
  }
}
