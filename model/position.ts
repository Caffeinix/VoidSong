import { SECTOR_SIZE_IN_WORLD_UNITS } from '../constants.js';
import { DeepReadonlyObject } from '../deep_readonly.js';
import { WorldPoint } from '../types.js';
import { Position } from './position.js';
import { Sector } from './sector.js';

export interface Position {
  sector: Sector;
  /**
   * x coordinate, in meters.
   */
  x: number;
  /**
   * y coordinate, in meters.
   */
  y: number;
}
