import { Clock, Timestamp } from './clock.js';
import { ContactId } from './contact_id.js';
import { Ship } from './model/ship.js';
import { DebugView } from './debug_view.js';
import { Snapshot } from './snapshot.js';

export class SnapshotManager {
  private _snapshots: Map<ContactId, Snapshot[]> = new Map();

  public addSnapshotForShip(ship: Ship, clock: Readonly<Clock>) {
    this.addSnapshot(ship.id, new Snapshot(clock.get(), ship));
  }

  public addSnapshot(contactId: ContactId, snapshot: Snapshot) {
    const snapshots = this._snapshots.get(contactId);
    if (snapshots) {
      // Replace the most recent snapshot if the timestamp is the same.
      if (snapshots[snapshots.length - 1].timestamp === snapshot.timestamp) {
        snapshots[snapshots.length - 1] = snapshot;
      } else {
        snapshots.push(snapshot);
      }
    } else {
      this._snapshots.set(contactId, [snapshot]);
    }

    DebugView.getView('snapshots').textContent =
      `${Array.from(this._snapshots.entries()).map(([key, value]) => value.length)}`;
  }

  public getContactIds(): IterableIterator<ContactId> {
    return this._snapshots.keys();
  }

  public getSnapshotForTimestamp(id: ContactId, targetTimestamp: Timestamp): Snapshot | undefined {
    const snapshots = this._snapshots.get(id);
    if (snapshots) {
      for (let i = snapshots.length - 1; i >= 0; --i) {
        if (snapshots[i].timestamp.seconds <= targetTimestamp.seconds) {
          return snapshots[i];
        }
      }
      return undefined;  // Ship did not exist yet.
    } else {
      return undefined;  // Ship never existed.
    }
  }

  public toString(): string {
    return Array.from(this._snapshots.entries()).map(
      ([key, value]) => `${key} -> ${JSON.stringify(value, undefined, 2)}`).join('\n');
  }
}
