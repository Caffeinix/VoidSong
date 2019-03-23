import { Ships } from './operations/ships.js';
/**
 * The updater processes changes to the world based on user or AI actions, that is to say anything
 * that might cause a new snapshot to be created.  This includes things like ships jumping to new
 * locations or accelerating.
 *
 * Player actions are communicated to the updater via the `computer` parameter to update, which is
 * a buffer representing the internal state of the player's ship's computer.  The updater reads
 * values out of the computer and applies them to the ship's systems, which may create new snapshots
 * of the ship's state that are visible to other ships.  Typically, after executing a command from
 * the computer, the value is cleared from the computer so it doesn't get applied a second time.
 */
export class Updater {
    /**
     *
     * @param world The world, in read-only mode.
     * @param clock The clock, in read-only mode.
     * @param snapshots The snapshot manager, in read-write mode.  It is expected that new snapshots
     *     may be created within update() if necessary.
     * @param computer The player's ship computer, which may contain commands that the updater will
     *     process and execute on the ship.
     */
    update(world, clock, snapshots, computer) {
        const playerShip = Ships.getPlayerShip(clock, snapshots);
        Ships.update(playerShip, clock, snapshots, computer);
        // TODO: Eventually, we will have ship AI which we can hook up here.
        // This will require us to have a separate computer for each ship instead of passing the
        // player's computer in here.
    }
}
//# sourceMappingURL=updater.js.map