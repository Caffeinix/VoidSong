export function fastClone(object) {
    const result = {};
    for (const entry of Object.entries(object)) {
        if (entry[1] instanceof Object) {
            result[entry[0]] = fastClone(entry[1]);
        }
        else {
            result[entry[0]] = entry[1];
        }
    }
    return result;
}
//# sourceMappingURL=fast_clone.js.map