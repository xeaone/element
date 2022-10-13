import { BindersType, ContextType, PathType } from './types.ts';

const Cache = new WeakMap();

const ContextResolve = async function (item: [BindersType, PathType], method: typeof ContextEvent) {
    await Promise.resolve(item).then(method);
};

const ContextEvent = async function ([binders, path]: [BindersType, PathType]) {
    const parents = [];
    const children = [];

    let key, value, binder;

    // console.log(path);
    // console.log(binders);
    for ([key, value] of binders) {
        if (value) {
            if ((key as string) === path) {
                for (binder of value) {
                    parents.push(binder);
                }
            } else if ((key as string)?.startsWith?.(`${path}.`)) {
                for (binder of value) {
                    children.push(binder);
                }
            }
        }
    }

    // console.log(parents, children);
    await Promise.all(parents.map(async (binder) => await binder.render?.(binder)));
    await Promise.all(children.map(async (binder) => await binder.render?.(binder)));
};

const ContextSet = function (binders: BindersType, path: PathType, target: any, key: any, value: any, receiver: any) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);

    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;

    if (from && typeof from === 'object') {
        Cache.delete(from);
    }

    Reflect.set(target, key, value, receiver);
    path = path ? `${path}.${key}` : key;

    ContextResolve([binders, path], ContextEvent);

    return true;
};

const ContextGet = function (binders: BindersType, path: PathType, target: any, key: any, receiver: any): any {
    if (typeof key === 'symbol') return Reflect.get(target, key);

    const value = Reflect.get(target, key, receiver);

    if (value && typeof value === 'object') {
        path = path ? `${path}.${key}` : key;

        const cache = Cache.get(value);
        if (cache) return cache;

        const proxy = new Proxy(value, {
            get: ContextGet.bind(null, binders, path),
            set: ContextSet.bind(null, binders, path),
        });

        Cache.set(value, proxy);

        return proxy;
    }

    return value;
};

const ContextCreate = function (data: ContextType, binders: BindersType, path: PathType = '') {
    return new Proxy(data, {
        get: ContextGet.bind(null, binders, path),
        set: ContextSet.bind(null, binders, path),
    });
};

export default ContextCreate;
