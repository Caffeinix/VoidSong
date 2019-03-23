import { ContactId } from '../contact_id.js';
import { Position } from './position.js';

// TODO: properties in here should be tagged as either Inherent (hard-wired into the system and
// can't be changed during the game), Updatable (can be changed via the computer or other systems,
// but requires the ship to be snapshotted when it changes), or Simulatable (can change over time
// in a predictable way that can be simulated from any timestamp without making a new snapshot).
//
// For now, we put @annotations on properties to indicate how they can be changed, but these have no
// runtime effect.  The key is:
//
// @inherent -    this property is not expected to change, though it can technically be modified via
//                a new snapshot.
// @updatable -   this property can be changed by creating a new snapshot of the ship.
// @simulatable - this property can be simulated through an arbitrary span of time without making a
//                new snapshot.
//
// Objects (non-primitives) that are marked @simulatable may still have properties that are
// @updatable or @inherent.

export interface Ship {
  /**
   * The internal unique ID of this contact.  Multiple contacts (and thus IDs)
   * may belong to the same physical ship.
   * @inherent
   */
  id: ContactId;
  /**
   * Whether this ship exists.  This may be set to false if this is the last
   * snapshot of a ship that has jumped or been destroyed.
   * @updatable
   */
  exists: boolean;
  /**
   * Whether this is the player ship.  There should be only one of these whose `exists` is true at
   * any given time.
   * @inherent
   */
  isPlayerShip: boolean;
  /**
   * The name of this ship as seen on sensors.
   * @updatable
   */
  name: string;
  /**
   * The location of this ship.
   * @simulatable
   */
  position: Position;
  /**
   * The facing (yaw) angle of this ship, in degrees off of the x-axis.
   * @simulatable
   */
  facing: number;
  /**
   * The linear velocity of this ship.
   * @simulatable
   */
  linearVelocity: LinearVelocity;
  /**
   * The linear acceleration of this ship.
   * @updatable
   */
  linearAcceleration: LinearAcceleration;
  /**
   * The angular velocity of this ship.
   * @simulatable
   */
  angularVelocity: AngularVelocity;
  /**
   * The angular acceleration of this ship.
   * @updatable
   */
  angularAcceleration: AngularAcceleration;

  /**
   * The ships' systems.
   * @simulatable
   */
  systems: Systems;
}

export interface LinearVelocity {
  /**
   * Velocity along the x axis, in m/s.
   * @simulatable
   */
  dx: number;
  /**
   * Velocity along the y axis, in m/s.
   * @simulatable
   */
  dy: number;
}

export interface LinearAcceleration {
  /**
   * Acceleration along the x axis, in m/s^2.
   * @updatable
   */
  ax: number;
  /**
   * Acceleration along the y axis, in m/s^2.
   * @updatable
   */
  ay: number;
}

export interface AngularVelocity {
  /**
   * Rate of yaw, in deg/s.
   * @simulatable
   */
  yaw: number;
}

export interface AngularAcceleration {
  /**
   * Rate of change of yaw, in deg/s^2.
   * @updatable
   */
  dyaw: number;
}

export interface Systems {
  reactor: Reactor;
  battery: Battery;
  powerRegulator: PowerRegulator;
  jumpDrive: JumpDrive;
}

export interface System {
  /**
   * @updatable
   */
  enabled: boolean;
}

export interface PowerSource extends System {
  /**
   * The amount of power being generated by this system, measured in MW (aka MJ/s).  This is read by
   * PowerDistribution.
   * @simulatable
   */
  powerOutput: number;

  /**
   * The change in the amount of power being generated by this system, measured in MW/s.
   * @updatable
   */
  powerOutputDelta: number;

  /**
   * The maximum amount of power this system can produce, in MW.
   * @inherent
   */
  maxPowerOutput: number;

  minPowerOutputDelta: number;

  maxPowerOutputDelta: number;
}

export interface PoweredSystem extends System {
  /**
   * The amount of power the system wants to operate optimally, in MW.  This is read by
   * PowerDistribution.
   * @updatable
   */
  requestedPowerInput: number;
  /**
   * The amount of power being supplied to the system, in MW.  This is set by PowerDistribution and
   * read by the system being powered.
   * @simulatable
   */
  powerInput: number;
  /**
   * The power priority of the system.  Systems with a lower value will be given power first (this
   * may seem backwards, but just remember that priority 1 is higher than priority 2).
   * @inherent
   */
  powerPriority: number;
  /**
   * The maximum input power for this system, in MW (aka MJ/s).
   * @inherent
   */
  maxPowerInput: number;
}

export interface PowerRegulator extends System {
  /**
   * The target charge percent of the battery (as a fraction, 0.0 - 1.0).
   * @updatable
   */
  targetBatteryChargePercent: number;
  /**
   * The tolerance of the regulator (as a fraction, 0.0 - 1.0).  If the difference between the
   * current battery charge percent and the target percent is greater than this value, the regulator
   * will change the reactor output to fix the problem.  Note that changing the reactor output
   * requires an update, so this value should be kept as large as possible to avoid oscillation.
   * @updatable
   */
  tolerance: number;
}

// tslint:disable-next-line: no-empty-interface
export interface Reactor extends PowerSource {
}

export interface Battery extends System {
  /**
   * The maximum input power for the battery, in MW (aka MJ/s).
   * @inherent
   */
  maxPowerInput: number;

  /**
   * The maximum amount of power the battery can produce, in MW (aka MJ/s).
   * @inherent
   */
  maxPowerOutput: number;

  /**
   * The current charge of the battery, in MJ.
   * @simulatable
   */
  charge: number;

  powerInput: number;

  powerOutput: number;

  /**
   * The energy capacity of the battery, in MJ.
   * @inherent
   */
  capacity: number;
}

export interface JumpDrive extends PoweredSystem {
  /**
   * Whether the jump drive is currently charging.
   * @updatable
   */
  charging: boolean;
  /**
   * The current charge of the drive in MJ.
   * @simulatable
   */
  charge: number;
  /**
   * The destination position, if defined.
   * @updatable
   */
  destination: Position | undefined;

  /**
   * The efficiency of this drive in ls/MJ.
   * @inherent
   */
  efficiency: number;
  /**
   * The maximum amount of acceleration the drive can compensate for, in m/s^2.
   * @inherent
   */
  maxAcceleration: number;
  /**
   * The base power required to jump any distance, in MJ.
   * @inherent
   */
  operatingPower: number;
  /**
   * The maximum power this drive can store in MJ.
   * @inherent
   */
  capacity: number;
  /**
   * The amount of possible drift along the medial axis of a jump, in units of the jump distance.
   * @inherent
   */
  driftRatioMedial: number;
  /**
   * The amount of possible drift along the lateral (transverse) axis of a jump, in units of the
   * jump distance.
   * @inherent
   */
  driftRatioLateral: number;
}
