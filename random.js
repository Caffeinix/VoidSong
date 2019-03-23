// Courtesy joshuakcockrell:
// https://stackoverflow.com/questions/25582882/
//     javascript-math-random-normal-distribution-gaussian-bell-curve/36481059#36481059
/**
 * Returns a pseudorandom number normally distributed around 0.
 *
 * With default parameter values, 95% of the generated numbers
 * will fall between -1.96 and 1.96.
 *
 * @param variance The variance of the generated distribution.
 * @param skew The skew of the generated distribution.
 */
export function randomNormal(variance = 1, skew = 1) {
    let u = 0;
    let v = 0;
    while (u === 0) {
        u = Math.random();
    } // Converting [0,1) to (0,1)
    while (v === 0) {
        v = Math.random();
    }
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = Math.pow(num, skew); // Skew
    num *= variance;
    return num;
}
//# sourceMappingURL=random.js.map