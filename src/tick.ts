const promise = Promise.resolve();

export default function tick (method: () => void) {
    return promise.then(method);
}