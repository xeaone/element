import { BindersType, ContextType, PathType } from './types.ts';

type EventType = 'render' | 'reset';

const Cache = new WeakMap();

const ContextResolve = async function (item: [BindersType, PathType, EventType], method: typeof ContextEvent) {
    await Promise.resolve(item).then(method);
};

const ContextEvent = async function ([binders, path, event]: [BindersType, PathType, EventType]) {
    // const parents = [];
    // const children = [];

    // let key, value, binder;

    // for ([key, value] of binders) {
    //     if (value) {
    //         if ((key as string) === path) {
    //             for (binder of value) {
    //                 parents.push(binder);
    //             }
    //         } else if ((key as string)?.startsWith?.(`${path}.`)) {
    //             for (binder of value) {
    //                 children.push(binder);
    //             }
    //         }
    //     }
    // }

    // await Promise.all(parents.map(async (binder) => await binder[event]?.()));
    // await Promise.all(children.map(async (binder) => await binder[event]?.()));
};

const ContextSet = function (binders: BindersType, path: PathType, target: any, key: any, value: any, receiver: any) {
    // console.log('set:', path, key);
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        ContextResolve([binders, path, 'render'], ContextEvent);
        ContextResolve([binders, path ? `${path}.${key}` : key, 'render'], ContextEvent);
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

    ContextResolve([binders, path, 'render'], ContextEvent);

    return true;
};

const ContextGet = function (binders: BindersType, path: PathType, target: any, key: any, receiver: any): any {
    // console.log('get:', path, key);
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    if (value && typeof value === 'object') {
        path = path ? `${path}.${key}` : key;

        const cache = Cache.get(value);
        if (cache) return cache;

        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, binders, path),
            set: ContextSet.bind(null, binders, path),
            deleteProperty: ContextDelete.bind(null, binders, path),
        });

        Cache.set(value, proxy);

        return proxy;
    }

    return value;
};

const ContextDelete = function (binders: BindersType, path: PathType, target: any, key: any) {
    // console.log('delete: ', path, key);
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    const from = Reflect.get(target, key);
    Cache.delete(from);
    Reflect.deleteProperty(target, key);

    path = path ? `${path}.${key}` : key;
    ContextResolve([binders, path, 'reset'], ContextEvent);

    return true;
};

const ContextCreate = function (data: ContextType, binders: BindersType, path: PathType = '') {
    return new Proxy(data, {
        get: ContextGet.bind(null, binders, path),
        set: ContextSet.bind(null, binders, path),
        deleteProperty: ContextDelete.bind(null, binders, path),
    });
};

export default ContextCreate;
