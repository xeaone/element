import { ComputeType } from './types.ts';

const ComputeNext = Promise.resolve();
const ComputeCache: Map<string, ComputeType> = new Map();

const Compute = async function (value: string) {
    await ComputeNext;

    const cache = ComputeCache.get(value);
    if (cache) return cache;

    const code = `
        with ($context) {
            with ($instance) {
                return (${value});
            }
        }
        `;

    const method = new Function('$context', '$instance', code) as ComputeType;

    ComputeCache.set(value, method);

    return method;
};

export default Compute;
