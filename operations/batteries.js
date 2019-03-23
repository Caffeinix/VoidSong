import { fastClone } from '../fast_clone.js';
export class Batteries {
    static clone(battery) {
        return fastClone(battery);
    }
    static simulate(oldShip, ship, step) {
    }
    static update(ship, clock, snapshots, computer) { }
}
//# sourceMappingURL=batteries.js.map