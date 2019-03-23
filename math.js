export function integrateWithConstantAcceleration(initialValue, initialRateOfChange, acceleration, step) {
    return initialValue + initialRateOfChange * step + 0.5 * acceleration * Math.pow(step, 2);
}
export function rateOfChangeAtTime(initialRateOfChange, acceleration, step) {
    return initialRateOfChange + acceleration * step;
}
//# sourceMappingURL=math.js.map