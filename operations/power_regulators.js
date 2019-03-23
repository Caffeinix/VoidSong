import { fastClone } from '../fast_clone.js';
import { Ships } from './ships.js';
export class PowerRegulators {
    static clone(regulator) {
        return fastClone(regulator);
    }
    static simulate(ship, step) {
        // This system has no simulatable properties.
    }
    static update(ship, clock, snapshots, computer) {
        if (!ship.systems.powerRegulator.enabled) {
            return;
        }
        // Update target charge percent from the computer.
        if (computer.powerRegulator && computer.powerRegulator.targetBatteryChargePercent &&
            computer.powerRegulator.targetBatteryChargePercent !==
                ship.systems.powerRegulator.targetBatteryChargePercent) {
            const newShip = Ships.clone(ship);
            newShip.systems.powerRegulator.targetBatteryChargePercent =
                computer.powerRegulator.targetBatteryChargePercent;
            snapshots.addSnapshotForShip(newShip, clock);
        }
        // Attempt to keep the battery charge within tolerance by adjusting the reactor throttle.
        const batteryChargePercent = ship.systems.battery.charge / ship.systems.battery.capacity;
        const difference = batteryChargePercent - ship.systems.powerRegulator.targetBatteryChargePercent;
        // TODO: for now, just force the reactor to full power or zero power whenever we're out of
        // tolerance.  Ultimately we should smooth this curve somewhat depending on how far out of
        // tolerance we are to avoid overcorrection.
        if (difference < 0 - ship.systems.powerRegulator.tolerance &&
            ship.systems.reactor.powerOutputDelta < ship.systems.reactor.maxPowerOutputDelta &&
            ship.systems.reactor.powerOutput < ship.systems.reactor.maxPowerOutput) {
            const newShip = Ships.clone(ship);
            newShip.systems.reactor.powerOutputDelta = ship.systems.reactor.maxPowerOutputDelta;
            snapshots.addSnapshotForShip(newShip, clock);
        }
        else if (difference > ship.systems.powerRegulator.tolerance &&
            ship.systems.reactor.powerOutputDelta > ship.systems.reactor.minPowerOutputDelta &&
            ship.systems.reactor.powerOutput > 0) {
            const newShip = Ships.clone(ship);
            newShip.systems.reactor.powerOutputDelta = ship.systems.reactor.minPowerOutputDelta;
            snapshots.addSnapshotForShip(newShip, clock);
        }
    }
}
//# sourceMappingURL=power_regulators.js.map