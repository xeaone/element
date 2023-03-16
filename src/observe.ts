export type ObserveValue = any;
export type ObserveTarget = any;
export type ObserveReceiver = any;
export type ObserveMethod = () => void;
export type ObserveKey = symbol | string;
export type ObserveData = Record<string, any>;

const ObserveCache = new WeakMap();

const ObserveSet = function (method: ObserveMethod, target: ObserveTarget, key: ObserveKey, value: ObserveValue, receiver: ObserveReceiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);

    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;

    if (from && (from.constructor.name === 'Object' || from.constructor.name === 'Array' || from.constructor.name === 'Function')) {
        const cache = ObserveCache.get(from);
        if (cache === value) return true;
        ObserveCache.delete(from);
    }

    Reflect.set(target, key, value, receiver);

    method();

    return true;
};

const ObserveGet = function (method: ObserveMethod, target: ObserveTarget, key: ObserveKey, receiver: ObserveReceiver): ObserveValue {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    // if (value && (value.constructor.name === 'Object' || value.constructor.name === 'Array')) {
    //     const cache = ObserveCache.get(value);
    //     if (cache) return cache;

    //     const proxy = new Proxy(value, {
    //         get: ObserveGet.bind(null, method),
    //         set: ObserveSet.bind(null, method),
    //         deleteProperty: ObserveDelete.bind(null, method),
    //     });

    //     ObserveCache.set(value, proxy);
    //     return proxy;
    // }

    // if (value && target.constructor.name === 'Object' && (value.constructor.name === 'Function' || value.constructor.name === 'AsyncFunction')) {
    //     const cache = ObserveCache.get(value);
    //     if (cache) return cache;

    //     const proxy = new Proxy(value, {
    //         apply(t, _, a) {
    //             return Reflect.apply(t, receiver, a);
    //         },
    //     });

    //     ObserveCache.set(value, proxy);
    //     return proxy;
    // }

    return value;
};

const ObserveDelete = function (method: ObserveMethod, target: ObserveTarget, key: ObserveKey) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    const from = Reflect.get(target, key);
    // ObserveCache.delete(from);
    Reflect.deleteProperty(target, key);

    method()

    return true;
};

const Observe = function (data: ObserveData, method: ObserveMethod) {
    return new Proxy(data, {
        get: ObserveGet.bind(null, method),
        set: ObserveSet.bind(null, method),
        deleteProperty: ObserveDelete.bind(null, method),
    });
};

export default Observe;
