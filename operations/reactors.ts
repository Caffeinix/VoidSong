import { Clock } from '../clock.js';
import { DeepReadonlyObject } from '../deep_readonly.js';
import { fastClone } from '../fast_clone.js';
import { rateOfChangeAtTime } from '../math.js';
import { Reactor, Ship } from '../model/ship.js';
import { ShipComputer } from '../ship_computer.js';
import { SnapshotManager } from '../snapshot_manager.js';
import { Ships } from './ships.js';

export class Reactors {
  public static clone(reactor: DeepReadonlyObject<Reactor>): Reactor {
    return fastClone(reactor);
  }

  public static simulate(oldShip: DeepReadonlyObject<Ship>, ship: Ship, step: number): void {
    const oldReactor = oldShip.systems.reactor;
    const reactor = ship.systems.reactor;
    if (!reactor.enabled) {
      return;
    }

    reactor.powerOutput = rateOfChangeAtTime(
      oldReactor.powerOutput, oldReactor.powerOutputDelta, step);
  }

  public static update(
    ship: DeepReadonlyObject<Ship>,
    clock: Readonly<Clock>,
    snapshots: SnapshotManager,
    computer: ShipComputer): void {
    if (!ship.systems.reactor.enabled) {
      return;
    }

    if (computer.reactorPowerDelta &&
      computer.reactorPowerDelta !== ship.systems.reactor.powerOutputDelta) {
      const newShip = Ships.clone(ship);
      newShip.systems.reactor.powerOutputDelta = computer.reactorPowerDelta;
      snapshots.addSnapshotForShip(newShip, clock);
    }

  }
}
