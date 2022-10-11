import { Path, RewriteName, RewriteValue } from './globals.ts';

const Resolve = function (item: any, method: any) {
    return Promise.resolve(item).then(method);
};

const ContextEvent = function ([binders, path, binder]: any) {
    const nodes = binders.get(path) ?? binders.set(path, new Set()).get(path);
    const iterator = nodes.values();

    let result = iterator.next();

    while (!result.done) {
        if (binder !== result.value) {
            Resolve(result.value, async (binder: any) => await binder?.render());
        }
        result = iterator.next();
    }
};

const ContextSet = function (binder: any, binders: any, path: any, target: any, key: any, value: any, receiver: any) {
    if (typeof key === 'symbol') return Reflect.set(target, key, value, receiver);

    const from = Reflect.get(target, key, receiver);
    // console.log('set:', path, key, value, from, binder);

    if (from === value) return true;
    if (Number.isNaN(from) && Number.isNaN(value)) return true;

    Reflect.set(target, key, value, receiver);

    if (key === target[RewriteName]) {
        path = path ? `${path}.${target[RewriteValue]}` : target[RewriteValue];
    } else {
        path = path ? `${path}.${key}` : key;
    }

    if (binder) {
        if (binders.has(path)) {
            binders.get(path).add(binder);
        } else {
            binders.set(path, new Set([binder]));
        }

        // Proxies?.get?.(binder)?.remove?.(path);
    }

    Resolve([binders, path, binder], ContextEvent);

    return true;
};

const ContextGet = function (binder: any, binders: any, path: any, target: any, key: any, receiver: any): any {
    // console.log('get:', path, key, binder);

    if (key === Path) return path;
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    if (key === target[RewriteName]) {
        path = path ? `${path}.${target[RewriteValue]}` : target[RewriteValue];
    } else {
        path = path ? `${path}.${key}` : key;
    }

    if (binder) {
        if (binders.has(path)) {
            binders.get(path).add(binder);
        } else {
            binders.set(path, new Set([binder]));
        }
    }

    const value = Reflect.get(target, key, receiver);

    if (value && typeof value === 'object') {
        let proxy;

        // if (binder) {
        //     if (!Proxies.has(binder)) Proxies.set(binder, new Map());
        //     proxy = Proxies.get(binder).get(path);
        //     if (proxy) return proxy;
        // }

        proxy = new Proxy(value, {
            get: ContextGet.bind(null, binder, binders, path),
            set: ContextSet.bind(null, binder, binders, path),
        });

        // if (binder) {
        //     Proxies.get(binder).set(path, proxy);
        // }

        return proxy;
        // return new Proxy(value, { get: get.bind(null, binder, binders, path), set: set.bind(null, binder, binders, path) });
    }

    return value;
};

const Context = function (data: any, binders: any, path?: any, binder?: any) {
    return new Proxy(data, {
        get: ContextGet.bind(null, binder, binders, path),
        set: ContextSet.bind(null, binder, binders, path),
    });
};

export default Context;
