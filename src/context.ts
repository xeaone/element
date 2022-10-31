import { ChangeType, ContextType, PathType } from './types.ts';

const Cache = new WeakMap();

const ContextSet = function (method: ChangeType, path: PathType, target: any, key: any, value: any, receiver: any) {
    // console.log('set:', path, key);
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        Promise.resolve([path, 'set']).then(method);
        Promise.resolve([path ? `${path}.${key}` : key, 'set']).then(method);
        return true;
    }

    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;

    if (from && typeof from === 'object') {
        const cache = Cache.get(from);
        if (cache === value) return true;
        Cache.delete(from);
    }

    Reflect.set(target, key, value, receiver);
    path = path ? `${path}.${key}` : key;

    Promise.resolve([path, 'set']).then(method);

    return true;
};

const ContextGet = function (method: ChangeType, path: PathType, target: any, key: any, receiver: any): any {
    // console.log('get:', path, key);
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    if (value && (value.constructor === Array || value.constructor === Object)) {
        // if (value && typeof value === 'object') {
        path = path ? `${path}.${key}` : key;

        const cache = Cache.get(value);
        if (cache) return cache;

        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, method, path),
            set: ContextSet.bind(null, method, path),
            deleteProperty: ContextDelete.bind(null, method, path),
        });

        Cache.set(value, proxy);

        return proxy;
    }

    return value;
};

const ContextDelete = function (method: ChangeType, path: PathType, target: any, key: any) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    const from = Reflect.get(target, key);
    Cache.delete(from);
    Reflect.deleteProperty(target, key);

    path = path ? `${path}.${key}` : key;

    Promise.resolve([path, 'delete']).then(method);

    return true;
};

const ContextCreate = function (data: ContextType, method: ChangeType, path: PathType = '') {
    return new Proxy(data, {
        get: ContextGet.bind(null, method, path),
        set: ContextSet.bind(null, method, path),
        deleteProperty: ContextDelete.bind(null, method, path),
    });
};

export default ContextCreate;
