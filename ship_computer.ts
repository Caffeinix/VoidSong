import { Position } from './model/position.js';

/**
 * A buffer representing the internal state of a ship's computer.  Since it cannot directly affect
 * the rest of the world, it is not simulated with the rest of the ship so we can avoid creating
 * extra snapshots of ships whenever their computer state changes.
 */
export interface ShipComputer {
  powerRegulator?: {
    targetBatteryChargePercent?: number;
  };
  reactorPowerDelta?: number;
  selectingJumpTarget?: boolean;
  jumpCommitted?: boolean;
  jumpDestination?: Position;
}
