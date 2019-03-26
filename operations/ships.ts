import { Clock } from '../clock.js';
import { DeepReadonlyObject } from '../deep_readonly.js';
import { fastClone } from '../fast_clone.js';
import { integrateWithConstantAcceleration, rateOfChangeAtTime } from '../math.js';
import { Ship } from '../model/ship.js';
import { ShipComputer } from '../ship_computer.js';
import { SnapshotManager } from '../snapshot_manager.js';
import { Batteries } from './batteries.js';
import { DebugView } from '../debug_view.js';
import { JumpDrives } from './jump_drives.js';
import { Positions } from './positions.js';
import { PowerDistribution } from './power_distribution.js';
import { PowerRegulators } from './power_regulators.js';
import { Reactors } from './reactors.js';

export class Ships {
  public static clone(ship: DeepReadonlyObject<Ship>): Ship {
    return fastClone(ship);
  }

  public static update(
    ship: DeepReadonlyObject<Ship>,
    clock: Readonly<Clock>,
    snapshots: SnapshotManager,
    computer: ShipComputer): void {
    PowerDistribution.update(ship, clock, snapshots, computer);
    PowerRegulators.update(ship, clock, snapshots, computer);
    Reactors.update(ship, clock, snapshots, computer);
    Batteries.update(ship, clock, snapshots, computer);
    JumpDrives.update(ship, clock, snapshots, computer);
  }

  public static simulate(ship: DeepReadonlyObject<Ship>, step: number): Ship {
    const newShip = this.clone(ship);
    this._simulateSystems(ship, newShip, step);
    this._simulateLinearMotion(ship, newShip, step);
    this._simulateRotation(ship, newShip, step);

    (document.getElementById('debug') as HTMLElement).textContent =
    step + `
` + JSON.stringify(newShip.systems, undefined, 2);

    return newShip;
  }

  public static getPlayerShip(clock: Readonly<Clock>, snapshots: Readonly<SnapshotManager>): Ship {
    let playerShip: Ship | undefined;
    for (const contactId of snapshots.getContactIds()) {
      const snapshot = snapshots.getSnapshotForTimestamp(contactId, clock.get());
      if (!snapshot) {
        continue;
      }
      const ship = snapshot.ship;
      if (ship.exists && ship.isPlayerShip) {
        playerShip = this.simulate(snapshot.ship, clock.get().seconds - snapshot.timestamp.seconds);
        break;
      }
    }
    if (!playerShip) {
      throw new Error('Player ship not found in snapshots!');
    }
    return playerShip;

  }

  /**
   * Modfied `ship` with its systems simulated over a number of seconds equal to `step`.  Note that
   * systems' `simulate` methods operate in-place without a clone, as they are expected to be called
   * from within `Ship.simulate`, which clones the ship.  These methods may modify systems other
   * than the ones being simulated.
   * @param ship The ship to simulate.
   * @param step The simulation step size, in seconds.
   */
  private static _simulateSystems(
    oldShip: DeepReadonlyObject<Ship>, ship: Ship, step: number): void {
    PowerDistribution.simulate(oldShip, ship, step);
    Reactors.simulate(oldShip, ship, step);
    Batteries.simulate(oldShip, ship, step);
    JumpDrives.simulate(ship, step);
    PowerRegulators.simulate(ship, step);
  }

  /**
   * Modifies `ship` with its motion through space simulated over a
   * number of seconds equal to `step` based on its current position,
   * velocity, and acceleration.
   * @param ship The ship to simulate.
   * @param step The simulation step size, in seconds.
   */
  private static _simulateLinearMotion(
    oldShip: DeepReadonlyObject<Ship>, ship: Ship, step: number): void {
    const dx = integrateWithConstantAcceleration(
      0, oldShip.linearVelocity.dx, oldShip.linearAcceleration.ax, step);
    const dy = integrateWithConstantAcceleration(
      0, oldShip.linearVelocity.dy, oldShip.linearAcceleration.ay, step);
    this._move(ship, dx, dy);

    // Update velocity as a side effect.
    ship.linearVelocity.dx =
      rateOfChangeAtTime(oldShip.linearVelocity.dx, oldShip.linearAcceleration.ax, step);
    ship.linearVelocity.dy =
      rateOfChangeAtTime(oldShip.linearVelocity.dy, oldShip.linearAcceleration.ay, step);
  }

  /**
   * Modifies `ship` with its rotation simulated over a
   * number of seconds equal to `step` based on its current facing,
   * angular velocity, and angular acceleration.
   * @param ship The ship to simulate.
   * @param step The simulation step size, in seconds.
   */
  private static _simulateRotation(
    oldShip: DeepReadonlyObject<Ship>, ship: Ship, step: number): void {
    const yaw = integrateWithConstantAcceleration(
      0, oldShip.angularVelocity.yaw, oldShip.angularAcceleration.dyaw, step);
    this._rotate(ship, yaw);

    // Update angular velocity as a side effect.
    ship.angularVelocity.yaw =
      rateOfChangeAtTime(oldShip.angularVelocity.yaw, oldShip.angularAcceleration.dyaw, step);
  }

  /**
   * Moves `ship` by `dx` meters on the x axis and `dy` meters on the y axis.
   * The ship's position will be modified in-place, and the position will be
   * normalized.
   * @param ship
   * @param dx
   * @param dy
   */
  private static _move(ship: Ship, dx: number, dy: number): void {
    const pos = Positions.normalized(ship.position);
    pos.x += dx;
    pos.y += dy;
    ship.position = Positions.normalized(pos);
  }

  /**
   * Rotates `ship` by `yaw` degrees.
   * The ship's facing will be modified in-place, and will be normalized.
   * @param ship
   * @param dx
   * @param dy
   */
  private static _rotate(ship: Ship, yaw: number): void {
    while (ship.facing + yaw > 360.0) {
      ship.facing -= 360.0;
    }
    while (ship.facing + yaw < 0.0) {
      ship.facing += 360.0;
    }
    ship.facing += yaw;
  }
}
