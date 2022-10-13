import { ComputeType } from './types.ts';

const Cache: Map<string, ComputeType> = new Map();

const Compute = function (value: string) {
    const cache = Cache.get(value);
    if (cache) return cache;

    const code = `
    with ($context) {
        with ($instance) {
            return (${value});
        }
    }
    `;

    const method = new Function('$context', '$instance', code) as ComputeType;

    Cache.set(value, method);

    return method;
};

export default Compute;
