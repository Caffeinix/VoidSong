import { fastClone } from '../fast_clone.js';
import { rateOfChangeAtTime } from '../math.js';
import { Ships } from './ships.js';
export class Reactors {
    static clone(reactor) {
        return fastClone(reactor);
    }
    static simulate(oldShip, ship, step) {
        const oldReactor = oldShip.systems.reactor;
        const reactor = ship.systems.reactor;
        if (!reactor.enabled) {
            return;
        }
        reactor.powerOutput = rateOfChangeAtTime(oldReactor.powerOutput, oldReactor.powerOutputDelta, step);
    }
    static update(ship, clock, snapshots, computer) {
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
//# sourceMappingURL=reactors.js.map