import { fastClone } from '../fast_clone.js';
import { integrateWithConstantAcceleration, rateOfChangeAtTime } from '../math.js';
import { Batteries } from './batteries.js';
import { JumpDrives } from './jump_drives.js';
import { Positions } from './positions.js';
import { PowerDistribution } from './power_distribution.js';
import { PowerRegulators } from './power_regulators.js';
import { Reactors } from './reactors.js';
export class Ships {
    static clone(ship) {
        return fastClone(ship);
    }
    static update(ship, clock, snapshots, computer) {
        PowerDistribution.update(ship, clock, snapshots, computer);
        PowerRegulators.update(ship, clock, snapshots, computer);
        Reactors.update(ship, clock, snapshots, computer);
        Batteries.update(ship, clock, snapshots, computer);
        JumpDrives.update(ship, clock, snapshots, computer);
    }
    static simulate(ship, step) {
        const newShip = this.clone(ship);
        this._simulateSystems(ship, newShip, step);
        this._simulateLinearMotion(ship, newShip, step);
        this._simulateRotation(ship, newShip, step);
        document.getElementById('debug').textContent =
            step + `
` + JSON.stringify(newShip.systems, undefined, 2);
        return newShip;
    }
    static getPlayerShip(clock, snapshots) {
        let playerShip;
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
    static _simulateSystems(oldShip, ship, step) {
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
    static _simulateLinearMotion(oldShip, ship, step) {
        const dx = integrateWithConstantAcceleration(0, oldShip.linearVelocity.dx, oldShip.linearAcceleration.ax, step);
        const dy = integrateWithConstantAcceleration(0, oldShip.linearVelocity.dy, oldShip.linearAcceleration.ay, step);
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
    static _simulateRotation(oldShip, ship, step) {
        const yaw = integrateWithConstantAcceleration(0, oldShip.angularVelocity.yaw, oldShip.angularAcceleration.dyaw, step);
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
    static _move(ship, dx, dy) {
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
    static _rotate(ship, yaw) {
        while (ship.facing + yaw > 360.0) {
            ship.facing -= 360.0;
        }
        while (ship.facing + yaw < 0.0) {
            ship.facing += 360.0;
        }
        ship.facing += yaw;
    }
}
//# sourceMappingURL=ships.js.map