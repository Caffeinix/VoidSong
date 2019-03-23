import { Timestamp } from './clock.js';
import { Ship } from './model/ship.js';

export class Snapshot {
  public timestamp: Timestamp;
  public ship: Ship;

  constructor(timestamp: Timestamp, ship: Ship) {
    this.timestamp = timestamp;
    this.ship = ship;
    return this;
  }
}
