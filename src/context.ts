type ContextValue = any;
type ContextTarget = any;
type ContextReceiver = any;
type ContextMethod = () => void;
type ContextKey = symbol | string;
type ContextData = Record<string, any>;

const ContextCache = new WeakMap();
const ContextNext = Promise.resolve();
// const ContextSymbol = Symbol('context');

const ContextSet = function (method: ContextMethod, target: ContextTarget, key: ContextKey, value: ContextValue, receiver: ContextReceiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);

    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;

    if (from && from.constructor.name === 'Object' || from.constructor.name === 'Array' || from.constructor.name === 'Function') {
        const cache = ContextCache.get(from);
        if (cache === value) return true;
        ContextCache.delete(from);
    }

    Reflect.set(target, key, value, receiver);

    ContextNext.then(method);

    return true;
};

const ContextGet = function (method: ContextMethod, target: ContextTarget, key: ContextKey, receiver: ContextReceiver): ContextValue {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    if (value && value.constructor.name === 'Object' || value.constructor.name === 'Array') {
        const cache = ContextCache.get(value);
        if (cache) return cache;

        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, method),
            set: ContextSet.bind(null, method),
            deleteProperty: ContextDelete.bind(null, method),
        });

        ContextCache.set(value, proxy);
        return proxy;
    }

    if (value && target.constructor.name === 'Object' && value.constructor.name === 'Function' || value.constructor.name === 'AsyncFunction') {
        const cache = ContextCache.get(value);
        if (cache) return cache;

        const proxy = new Proxy(value, {
            apply(t, _, a) {
                return Reflect.apply(t, receiver, a);
            },
        });

        ContextCache.set(value, proxy);
        return proxy;
    }

    return value;
};

const ContextDelete = function (method: ContextMethod, target: ContextTarget, key: ContextKey) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    const from = Reflect.get(target, key);
    ContextCache.delete(from);
    Reflect.deleteProperty(target, key);

    ContextNext.then(method);

    return true;
};

const ContextCreate = function (data: ContextData, method: ContextMethod) {
    return new Proxy(data, {
        get: ContextGet.bind(null, method),
        set: ContextSet.bind(null, method),
        deleteProperty: ContextDelete.bind(null, method),
    });
};

export default ContextCreate;
