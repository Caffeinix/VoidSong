import { Ship } from './ship.js';
import { StaticObject } from './static_object.js';

export interface World {
  apparentShips: Ship[];
  actualShips: Ship[];
  staticObjects: StaticObject[];
}
