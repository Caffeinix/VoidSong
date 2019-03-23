import { METER_IN_WORLD_UNITS } from './constants.js';
import { DeepReadonlyObject } from './deep_readonly.js';
import { Ship } from './model/ship.js';

export function fastClone<T extends object>(object: DeepReadonlyObject<T>): T {
  const result: T = {} as T;
  for (const entry of Object.entries(object)) {
    if (entry[1] instanceof Object) {
      result[entry[0]] = fastClone(entry[1]);
    } else {
      result[entry[0]] = entry[1];
    }
  }
  return result;
}
