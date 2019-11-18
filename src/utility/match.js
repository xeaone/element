
export default function Match (source, target) {

    if (source === target) {
        return true;
    }

    if (source === null || source === undefined) {
        return false;
    }

    if (target === null || target === undefined) {
        return false;
    }

    if (typeof source !== typeof target) {
        return false;
    }

    if (source.constructor !== target.constructor) {
        return false;
    }

    if (typeof source !== 'object' || typeof target !== 'object') {
        return source === target;
    }

    const sourceKeys = Object.keys(source);
    const targetKeys = Object.keys(target);

    if (sourceKeys.length !== targetKeys.length) {
        return false;
    }

    for (let i = 0; i < sourceKeys.length; i++) {
        const name = sourceKeys[i];

        if (!Match(source[name], target[name])) {
            return false;
        }

    }

    return true;
}
