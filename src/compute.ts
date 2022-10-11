const ComputeCache = new Map();

const Compute = function (code: string) {
    const cache = ComputeCache.get(code);
    if (cache) return cache;

    const method = new Function(
        '$context',
        '$instance',
        `with ($context) { with ($instance) {
            return (${code});
        } }`,
    );

    ComputeCache.set(code, method);

    return method;
};

export default Compute;
