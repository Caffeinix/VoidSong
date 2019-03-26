import { Clock, Timestamp } from './clock.js';
import { LIGHT_SECOND_IN_WORLD_UNITS, SECTOR_SIZE_IN_WORLD_UNITS } from './constants.js';
import { ContactId } from './contact_id.js';
import { Ship } from './model/ship.js';
import { World } from './model/world.js';
import { DebugView } from './debug_view.js';
import { Positions } from './operations/positions.js';
import { Ships } from './operations/ships.js';
import { SnapshotManager } from './snapshot_manager.js';

/**
 * The physics engine, which simulates the world through time.
 *
 * The physics engine never generates new snapshots.  It can only simulate predictable, physical
 * processes like acceleration due to thrust or gravity, or power flowing between systems.
 */
export class Physics {
  constructor() { }

  /**
   * Simulates the world up to the present moment (as defined by `clock.get()`).
   *
   * `simulate` does not return a value, but instead updates the `world` object in-place by
   * replacing its `apparentShips` and `actualShips` arrays with new ones reflecting the actual and
   * apparent ships at the present moment.  These arrays are expected to be input to the renderer
   * (along with the other, non-changing members of the World) to be displayed on screen.
   *
   * @param world
   * @param clock
   * @param snapshots
   */
  public simulate(world: World, clock: Readonly<Clock>, snapshots: Readonly<SnapshotManager>) {
    world.apparentShips = [];
    world.actualShips = [];
    for (const contactId of snapshots.getContactIds()) {
      this._simulateShip(contactId, world, clock, snapshots);
    }
    DebugView.getView('physics').textContent =
      `${world.actualShips.map((ship) => `${ship.isPlayerShip}/${ship.exists}`)}`;
  }

  /**
   * Simulates the ship with `contactId` from its last known snapshot up to
   * the present moment.  Populates `world.actualShips` and
   * `world.apparentShips` with the actual and apparent images of the ship
   * based on its (actual) distance to the player, if the ship existed at
   * those two points in time.
   *
   * @param contactId
   * @param world
   * @param clock
   * @param snapshots
   */
  private _simulateShip(
    contactId: ContactId,
    world: World,
    clock: Readonly<Clock>,
    snapshots: Readonly<SnapshotManager>) {
    const latestShip = this._simulateShipToTimestamp(contactId, snapshots, clock.get());
    if (!latestShip) {
      // This ship never existed.
      console.error('No snapshots found for contact ID', contactId);
      return;
    }
    if (!latestShip.exists) {
      return;
    }
    world.actualShips.push(latestShip);
    if (latestShip.isPlayerShip) {
      // The actual player ship is always identical to the apparent one.
      world.apparentShips.push(latestShip);
    } else {
      const playerShip = Ships.getPlayerShip(clock, snapshots);
      const distance = Positions.getDistanceInWorldUnits(playerShip.position, latestShip.position);
      const targetTimestamp = clock.secondsAgo(distance / LIGHT_SECOND_IN_WORLD_UNITS);
      const apparentShip = this._simulateShipToTimestamp(contactId, snapshots, targetTimestamp);
      if (apparentShip && apparentShip.exists) {
        world.apparentShips.push(apparentShip);
      } else {
        // This ship didn't exist at that point in time, so there's nothing to do.
      }
    }
  }

  /**
   * Returns a copy of the ship with the given contact ID whose state has been
   * simulated up to `timestamp` based on its most recent snapshot.  If there
   * are no snapshots for the ship, returns undefined.
   * @param contactId
   * @param snapshots
   * @param timestamp The timestamp to simulate the ship up to.
   * @returns An up-to-date copy of the ship, or undefined if no snapshots were found.
   */
  private _simulateShipToTimestamp(
    contactId: ContactId,
    snapshots: Readonly<SnapshotManager>,
    timestamp: Timestamp): Ship | undefined {
    const snapshot = snapshots.getSnapshotForTimestamp(contactId, timestamp);
    if (!snapshot) {
      return undefined;
    }
    if (!snapshot.ship.exists) {
      // Non-existent ships can't change.  As an optimization, return the old one.
      return snapshot.ship;
    }
    return Ships.simulate(snapshot.ship, timestamp.seconds - snapshot.timestamp.seconds);
  }
}
