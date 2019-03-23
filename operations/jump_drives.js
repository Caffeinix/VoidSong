import { LIGHT_SECOND_IN_WORLD_UNITS } from '../constants.js';
import { getNextContactId } from '../contact_id.js';
import { fastClone } from '../fast_clone.js';
import { randomNormal } from '../random.js';
import { WorldPoint } from '../types.js';
import { Positions } from './positions.js';
import { Ships } from './ships.js';
export class JumpDrives {
    static clone(jumpDrive) {
        return fastClone(jumpDrive);
    }
    static simulate(ship, step) {
        const jumpDrive = ship.systems.jumpDrive;
        if (jumpDrive.enabled) {
            if (jumpDrive.charging) {
                jumpDrive.charge += jumpDrive.powerInput * step;
            }
        }
    }
    static update(ship, clock, snapshots, computer) {
        if (!ship.systems.jumpDrive.enabled) {
            return;
        }
        const jumpDrive = ship.systems.jumpDrive;
        // Load jump destination from ship's computer if necessary.
        if (!jumpDrive.charging && computer.jumpCommitted) {
            const newShip = Ships.clone(ship);
            newShip.systems.jumpDrive.destination = computer.jumpDestination;
            newShip.systems.jumpDrive.charging = true;
            newShip.systems.jumpDrive.requestedPowerInput = newShip.systems.jumpDrive.maxPowerInput;
            computer.jumpCommitted = false;
            computer.jumpDestination = undefined;
            snapshots.addSnapshotForShip(newShip, clock);
        }
        if (jumpDrive.charge > jumpDrive.capacity) {
            // Capacity exceeded.  Emergency shutdown!
            // TODO: bleed power to other systems as heat.
            const newShip = Ships.clone(ship);
            newShip.systems.jumpDrive.charge = 0;
            newShip.systems.jumpDrive.charging = false;
            newShip.systems.jumpDrive.requestedPowerInput = 0;
            snapshots.addSnapshotForShip(newShip, clock);
        }
        // Jump ship if jump drive is charged.
        if (jumpDrive.charging && jumpDrive.destination) {
            const distance = Positions.getDistanceInWorldUnits(ship.position, jumpDrive.destination);
            const requiredPower = jumpDrive.operatingPower +
                ((distance / LIGHT_SECOND_IN_WORLD_UNITS) / jumpDrive.efficiency);
            if (jumpDrive.charge >= requiredPower) {
                const oldShip = Ships.clone(ship);
                // This instance of the ship stops here.
                oldShip.exists = false;
                snapshots.addSnapshotForShip(oldShip, clock);
                // A new instance of the ship will be created with a new contact ID.
                const newShip = Ships.clone(ship);
                newShip.id = getNextContactId();
                newShip.position = this._calculateActualDestination(ship);
                newShip.systems.jumpDrive.charge = 0;
                newShip.systems.jumpDrive.charging = false;
                newShip.systems.jumpDrive.requestedPowerInput = 0;
                snapshots.addSnapshotForShip(newShip, clock);
            }
        }
    }
    static _calculateActualDestination(ship) {
        const jumpDrive = ship.systems.jumpDrive;
        if (!jumpDrive.destination) {
            console.error('Jump drive destination was not specified.');
            return ship.position;
        }
        // 1. Calculate a point a normally distributed random amount away from the origin on a uniformly
        //    random angle, where the distance is related to the medial drift ratio.
        // 2. Transform that point using a matrix initialized based on the ratio between medial and
        //    lateral drift.
        const intendedDistance = Positions.getDistanceInWorldUnits(ship.position, jumpDrive.destination);
        const intendedAngle = Positions.getAngle(ship.position, jumpDrive.destination);
        const driftRatioMedial = jumpDrive.driftRatioMedial;
        const driftRatioLateral = jumpDrive.driftRatioLateral;
        // The upper bound on the 95% confidence interval for medial drift.
        const maxDistance95 = intendedDistance + (driftRatioMedial * intendedDistance);
        const minDistance95 = intendedDistance - (driftRatioMedial * intendedDistance);
        // Normally distributed with a 95% chance of being between -1.96 and 1.96.
        let displacement = randomNormal();
        displacement *= (maxDistance95 - minDistance95) / (1.96 * 2);
        // Displacement is now the magnitude of our desired vector.
        const angle = Math.random() * 2 * Math.PI; // Random angle in radians.
        const vector = new DOMPoint(displacement * Math.cos(angle), displacement * Math.sin(angle));
        // Transform our displacement vector onto a rotated ellipse with the right axes.
        // Note that DOMMatrix apparently does rotations in degrees (?!)
        const displacementVector = new DOMMatrix().rotate(intendedAngle * 180 / Math.PI)
            .scale(1.0, driftRatioLateral / driftRatioMedial).transformPoint(vector);
        const originalVector = Positions.getWorldPointForPosition(jumpDrive.destination);
        const actualVector = new WorldPoint(originalVector.x + displacementVector.x, originalVector.y + displacementVector.y);
        return Positions.getPositionForWorldPoint(actualVector);
    }
}
//# sourceMappingURL=jump_drives.js.map