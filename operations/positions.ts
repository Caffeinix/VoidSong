import { SECTOR_SIZE_IN_WORLD_UNITS } from '../constants.js';
import { DeepReadonlyObject } from '../deep_readonly.js';
import { Position } from '../model/position.js';
import { WorldPoint } from '../types.js';

export class Positions {
  public static normalized(position: DeepReadonlyObject<Position>): Position {
    const result: Position = JSON.parse(JSON.stringify(position));
    while (result.x > SECTOR_SIZE_IN_WORLD_UNITS) {
      ++result.sector.x;
      result.x -= SECTOR_SIZE_IN_WORLD_UNITS;
    }
    while (result.x < 0) {
      --result.sector.x;
      result.x += SECTOR_SIZE_IN_WORLD_UNITS;
    }

    while (result.y > SECTOR_SIZE_IN_WORLD_UNITS) {
      ++result.sector.y;
      result.y -= SECTOR_SIZE_IN_WORLD_UNITS;
    }
    while (result.y < 0) {
      --result.sector.y;
      result.y += SECTOR_SIZE_IN_WORLD_UNITS;
    }
    return result;
  }

  public static getDistanceInWorldUnits(
    from: DeepReadonlyObject<Position>, to: DeepReadonlyObject<Position>): number {
    const fromPosition = this.getWorldPointForPosition(from);
    const toPosition = this.getWorldPointForPosition(to);
    return Math.abs(Math.hypot(toPosition.x - fromPosition.x, toPosition.y - fromPosition.y));
  }

  public static getAngle(
    from: DeepReadonlyObject<Position>, to: DeepReadonlyObject<Position>): number {
    const fromPosition = this.getWorldPointForPosition(from);
    const toPosition = this.getWorldPointForPosition(to);
    return Math.atan2(toPosition.y - fromPosition.y, toPosition.x - fromPosition.x);
  }

  public static getWorldPointForPosition(position: DeepReadonlyObject<Position>): WorldPoint {
    const xPosition = (position.sector.x * SECTOR_SIZE_IN_WORLD_UNITS + position.x);
    const yPosition = (position.sector.y * SECTOR_SIZE_IN_WORLD_UNITS + position.y);
    return new WorldPoint(xPosition, yPosition);
  }

  public static getPositionForWorldPoint(worldPoint: WorldPoint): Position {
    const position: Position = {
      sector: {
        x: Math.trunc(worldPoint.x / SECTOR_SIZE_IN_WORLD_UNITS),
        y: Math.trunc(worldPoint.y / SECTOR_SIZE_IN_WORLD_UNITS),
      },
      x: worldPoint.x % SECTOR_SIZE_IN_WORLD_UNITS,
      y: worldPoint.y % SECTOR_SIZE_IN_WORLD_UNITS,
    };
    if (position.x < 0) {
      position.x += SECTOR_SIZE_IN_WORLD_UNITS;
      position.sector.x -= 1;
    }
    if (position.y < 0) {
      position.y += SECTOR_SIZE_IN_WORLD_UNITS;
      position.sector.y -= 1;
    }
    return position;
  }
}
