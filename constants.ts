const LIGHT_SECOND_METERS = 299792458;
const LIGHT_MINUTE_METERS = LIGHT_SECOND_METERS * 60;
const LIGHT_HOUR_METERS = LIGHT_MINUTE_METERS * 60;

export const WORLD_UNIT_IN_METERS = 1.0e6;
export const METER_IN_WORLD_UNITS = 1 / WORLD_UNIT_IN_METERS;

export const LIGHT_SECOND_IN_WORLD_UNITS = LIGHT_SECOND_METERS / WORLD_UNIT_IN_METERS;
export const LIGHT_MINUTE_IN_WORLD_UNITS = LIGHT_MINUTE_METERS / WORLD_UNIT_IN_METERS;
export const LIGHT_HOUR_IN_WORLD_UNITS = LIGHT_HOUR_METERS / WORLD_UNIT_IN_METERS;

export const SECTOR_SIZE_IN_WORLD_UNITS = LIGHT_MINUTE_IN_WORLD_UNITS;
