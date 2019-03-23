import { Clock } from '../clock.js';
import { DeepReadonlyObject } from '../deep_readonly.js';
import { fastClone } from '../fast_clone.js';
import { rateOfChangeAtTime } from '../math.js';
import { Battery, Ship } from '../model/ship.js';
import { ShipComputer } from '../ship_computer.js';
import { SnapshotManager } from '../snapshot_manager.js';

export class Batteries {
  public static clone(battery: DeepReadonlyObject<Battery>): Battery {
    return fastClone(battery);
  }

  public static simulate(oldShip: DeepReadonlyObject<Ship>, ship: Ship, step: number): void {
  }

  public static update(
    ship: DeepReadonlyObject<Ship>,
    clock: Readonly<Clock>,
    snapshots: SnapshotManager,
    computer: ShipComputer): void { }
}
