import { DebugView } from './debug_view.js';
import { Snapshot } from './snapshot.js';
export class SnapshotManager {
    constructor() {
        this._snapshots = new Map();
    }
    addSnapshotForShip(ship, clock) {
        this.addSnapshot(ship.id, new Snapshot(clock.get(), ship));
    }
    addSnapshot(contactId, snapshot) {
        const snapshots = this._snapshots.get(contactId);
        if (snapshots) {
            // Replace the most recent snapshot if the timestamp is the same.
            if (snapshots[snapshots.length - 1].timestamp === snapshot.timestamp) {
                snapshots[snapshots.length - 1] = snapshot;
            }
            else {
                snapshots.push(snapshot);
            }
        }
        else {
            this._snapshots.set(contactId, [snapshot]);
        }
        DebugView.getView('snapshots').textContent =
            `${Array.from(this._snapshots.entries()).map(([key, value]) => value.length)}`;
    }
    getContactIds() {
        return this._snapshots.keys();
    }
    getSnapshotForTimestamp(id, targetTimestamp) {
        const snapshots = this._snapshots.get(id);
        if (snapshots) {
            for (let i = snapshots.length - 1; i >= 0; --i) {
                if (snapshots[i].timestamp.seconds <= targetTimestamp.seconds) {
                    return snapshots[i];
                }
            }
            return undefined; // Ship did not exist yet.
        }
        else {
            return undefined; // Ship never existed.
        }
    }
    toString() {
        return Array.from(this._snapshots.entries()).map(([key, value]) => `${key} -> ${JSON.stringify(value, undefined, 2)}`).join('\n');
    }
}
//# sourceMappingURL=snapshot_manager.js.map