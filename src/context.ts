type ContextValue = any;
type ContextTarget = any;
type ContextReceiver = any;
type ContextMethod = () => void;
type ContextKey = symbol | string;
type ContextData = Record<string, any>;

// const ContextApply = function (target: ContextTarget, receiver: ContextReceiver, args: any[]) {
//     return Reflect.apply(target, receiver, args);
// };

const ContextSet = function (method: ContextMethod, target: ContextTarget, key: ContextKey, value: ContextValue, receiver: ContextReceiver) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);

    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;

    Reflect.set(target, key, value, receiver);

    method();

    return true;
};

const ContextGet = function (method: ContextMethod, target: ContextTarget, key: ContextKey, receiver: ContextReceiver): ContextValue {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    if (value?.constructor?.name === 'Object' || value?.constructor?.name === 'Array') {
        return new Proxy(value, {
            get: ContextGet.bind(null, method),
            set: ContextSet.bind(null, method),
            deleteProperty: ContextDelete.bind(null, method),
        });
    }

    if (value?.constructor?.name === 'Function' || value?.constructor?.name === 'AsyncFunction') {
        return new Proxy(value, {
            apply: (t, _, a) => Reflect.apply(t, receiver, a)
        });
    }

    return value;
};

const ContextDelete = function (method: ContextMethod, target: ContextTarget, key: ContextKey) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    Reflect.deleteProperty(target, key);

    method();

    return true;
};

const Context = function (data: ContextData, method: ContextMethod): Record<any, any> {
    return new Proxy(data, {
        get: ContextGet.bind(null, method),
        set: ContextSet.bind(null, method),
        deleteProperty: ContextDelete.bind(null, method),
    });
};

export default Context;
