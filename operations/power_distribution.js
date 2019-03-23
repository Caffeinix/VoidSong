import { integrateWithConstantAcceleration } from '../math.js';
import { Ships } from './ships.js';
const EPSILON = 0.016667; // Approximately one frame.
export class PowerDistribution {
    static update(ship, clock, snapshots, computer) {
        if (!ship.systems.reactor.enabled) {
            return;
        }
        // TODO: Move this to reactors.ts?
        const powerOutput = ship.systems.reactor.powerOutput;
        const powerOutputDelta = ship.systems.reactor.powerOutputDelta;
        if (powerOutput <= 0 && powerOutputDelta < 0) {
            const newShip = Ships.clone(ship);
            newShip.systems.reactor.powerOutput = 0;
            newShip.systems.reactor.powerOutputDelta = 0;
            snapshots.addSnapshotForShip(newShip, clock);
        }
        if (powerOutput >= ship.systems.reactor.maxPowerOutput && powerOutputDelta > 0) {
            const newShip = Ships.clone(ship);
            newShip.systems.reactor.powerOutput = ship.systems.reactor.maxPowerOutput;
            newShip.systems.reactor.powerOutputDelta = 0;
            snapshots.addSnapshotForShip(newShip, clock);
        }
        // TODO: move this to batteries.ts?
        const powerInput = ship.systems.battery.powerInput;
        if (powerInput >= ship.systems.battery.maxPowerInput) {
            const newShip = Ships.clone(ship);
            newShip.systems.battery.powerInput = ship.systems.battery.maxPowerInput;
            snapshots.addSnapshotForShip(newShip, clock);
        }
    }
    static simulate(oldShip, ship, step) {
        const oldDistributedEnergy = this.getDistributedEnergy(oldShip, ship, step - EPSILON);
        const newDistributedEnergy = this.getDistributedEnergy(oldShip, ship, step);
        for (const system of newDistributedEnergy.suppliedEnergyBySystem.keys()) {
            const oldEnergy = oldDistributedEnergy.suppliedEnergyBySystem.get(system) || 0;
            const newEnergy = newDistributedEnergy.suppliedEnergyBySystem.get(system) || 0;
            system.powerInput = (newEnergy - oldEnergy) / EPSILON;
        }
        // Deduct any energy we took from the battery from its charge.
        const oldCharge = this.calculateBatteryCharge(oldDistributedEnergy, oldShip, step - EPSILON);
        const newCharge = this.calculateBatteryCharge(newDistributedEnergy, oldShip, step);
        ship.systems.battery.charge = newCharge;
        ship.systems.battery.powerInput = (newCharge - oldCharge) / EPSILON;
    }
    static calculateBatteryCharge(distributedEnergy, ship, step) {
        if (distributedEnergy.totalEnergyDrawnFromBattery > 0) {
            return ship.systems.battery.charge - distributedEnergy.totalEnergyDrawnFromBattery;
        }
        else if (distributedEnergy.totalEnergyDrawnFromReactor <
            distributedEnergy.availableEnergyFromReactor) {
            // If we have not used up all the reactor energy, we need to divert as much of what's left
            // over as we can to the battery.
            // Calculate the maximum amount of energy that can be diverted to the battery during the time
            // step.  This is the amount we are allowed to use to charge the battery; anything more than
            // this will have to be dissipated as heat.
            const maxEnergyToBattery = Math.min(ship.systems.battery.capacity - ship.systems.battery.charge, ship.systems.battery.maxPowerInput * step);
            const desiredEnergyToBattery = distributedEnergy.availableEnergyFromReactor -
                distributedEnergy.totalEnergyDrawnFromReactor;
            if (desiredEnergyToBattery < maxEnergyToBattery) {
                return ship.systems.battery.charge + desiredEnergyToBattery;
            }
            else {
                return ship.systems.battery.charge + maxEnergyToBattery;
                // TODO: dissipate desiredEnergyToBattery - maxEnergyToBattery into the hull as heat.
            }
        }
        else {
            return ship.systems.battery.charge;
        }
    }
    static getDistributedEnergy(ship, newShip, step) {
        const powerSources = [];
        const poweredSystems = [];
        for (const value of Object.values(ship.systems)) {
            const system = value;
            if (this.isPowerSource(system, ship.systems.battery)) {
                powerSources.push(system);
            }
        }
        // Need to use the new ship here so the systems will be identity-equal to the ones we intend to
        // update later on.
        for (const value of Object.values(newShip.systems)) {
            const system = value;
            if (this.isPoweredSystem(system, ship.systems.battery)) {
                poweredSystems.push(system);
            }
        }
        poweredSystems.sort((a, b) => a.powerPriority - b.powerPriority);
        const result = {
            availableEnergyFromReactor: 0,
            availableEnergyFromBattery: 0,
            suppliedEnergyBySystem: new Map(),
            totalEnergyDrawnFromReactor: 0,
            totalEnergyDrawnFromBattery: 0,
        };
        // Calculate the total amount of energy that has been generated by all power sources since the
        // last snapshot.
        result.availableEnergyFromReactor = powerSources.reduce((accum, source) => accum + integrateWithConstantAcceleration(0, source.powerOutput, source.powerOutputDelta, step), 0);
        // Calculate the maximum amount of energy that can be drawn from the battery during the time
        // step.  This is the amount we have available to draw from if the reactor isn't enough.
        result.availableEnergyFromBattery = Math.min(ship.systems.battery.charge, ship.systems.battery.maxPowerOutput * step);
        for (const system of poweredSystems) {
            const requestedEnergy = system.requestedPowerInput * step;
            let providedEnergyFromReactor = 0;
            let providedEnergyFromBattery = 0;
            if (requestedEnergy <
                result.availableEnergyFromReactor - result.totalEnergyDrawnFromReactor) {
                // All the energy will come from the reactor.
                providedEnergyFromReactor = requestedEnergy;
            }
            else {
                // Take all the remaining energy from the reactor, and make up the rest from the battery.
                providedEnergyFromReactor =
                    result.availableEnergyFromReactor - result.totalEnergyDrawnFromReactor;
                // The amount from the battery is either all the remaining energy we need, or all the energy
                // we have left in the battery, whichever is less.
                providedEnergyFromBattery = Math.min(requestedEnergy - providedEnergyFromReactor, result.availableEnergyFromBattery - result.totalEnergyDrawnFromBattery);
            }
            result.suppliedEnergyBySystem.set(system, providedEnergyFromReactor + providedEnergyFromBattery);
            // Deduct the energy we've taken from the reactor and battery pools, since it is no longer
            // available to the next system.
            result.totalEnergyDrawnFromReactor += providedEnergyFromReactor;
            result.totalEnergyDrawnFromBattery += providedEnergyFromBattery;
        }
        return result;
    }
    static isPowerSource(system, battery) {
        return system.powerOutput !== undefined && system !== battery;
    }
    static isPoweredSystem(system, battery) {
        return system.requestedPowerInput !== undefined && system !== battery;
    }
}
PowerDistribution.lastCharge = 0;
PowerDistribution.lastStep = 0;
//# sourceMappingURL=power_distribution.js.map