
export default function Match (source, target) {

    if (source === target) {
        return true;
    }

    const sourceType = typeof source;
    const targetType = typeof target;

    if (sourceType !== targetType) {
        return false;
    }

    if (sourceType !== 'object' || targetType !== 'object') {
        return source === target;
    }

    if (source.constructor !== target.constructor) {
        return false;
    }

    const sourceKeys = Object.keys(source);
    const targetKeys = Object.keys(target);

    if (sourceKeys.length !== targetKeys.length) {
        return false;
    }

    for (let i = 0; i < sourceKeys.length; i++) {
        const name = sourceKeys[i];
        const match = Match(source[name], target[name]);
        if (!match) return false;
    }

    return true;
}
