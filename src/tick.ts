const promise = Promise.resolve();

// export default function tick (method: (any: any) => any) {
export default function tick (method: (any: any) => any) {
    return promise.then(method);
}