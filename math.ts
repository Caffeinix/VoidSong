export function integrateWithConstantAcceleration(
  initialValue: number,
  initialRateOfChange: number,
  acceleration: number,
  step: number) {
  return initialValue + initialRateOfChange * step + 0.5 * acceleration * Math.pow(step, 2);
}

export function rateOfChangeAtTime(
  initialRateOfChange: number,
  acceleration: number,
  step: number) {
  return initialRateOfChange + acceleration * step;
}

