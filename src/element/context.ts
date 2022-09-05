import tick from './tick';

type ContextKeys = string | symbol;
// type ContextHandlers = 'render' | 'reset';

export const ContextGet = function (event: any, reference: string, target: any, key: ContextKeys, receiver: any): any {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);

    const value = Reflect.get(target, key, receiver);

    if (value && typeof value === 'object') {
        reference = reference ? `${reference}.${key}` : `${key}`;
        return new Proxy(value, {
            get: ContextGet.bind(this, event, reference),
            set: ContextSet.bind(this, event, reference),
            deleteProperty: ContextDelete.bind(this, event, reference)
        });
    }

    return value;
};

export const ContextDelete = function (event: any, reference: string, target: any, key: ContextKeys) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);

    Reflect.deleteProperty(target, key);

    tick(event.bind(this, reference ? `${reference}.${key}` : `${key}`, 'reset'));
    // tick(() => event(reference ? `${reference}.${key}` : `${key}`, 'reset'));

    return true;
};

export const ContextSet = function (event: any, reference: string, target: any, key: ContextKeys, to: any, receiver: any) {
    if (typeof key === 'symbol') return Reflect.set(target, key, receiver);

    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        // tick(() => event(reference, 'render'));
        // tick(() => event(reference ? `${reference}.${key}` : `${key}`, 'render'));
        tick(event.bind(this, reference, 'render'));
        tick(event.bind(this, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return Reflect.set(target, key, to, receiver);
    } else if (from === to || isNaN(from) && to === isNaN(to)) {
        return Reflect.set(target, key, to, receiver);
    }

    Reflect.set(target, key, to, receiver);
    tick(event.bind(this, reference ? `${reference}.${key}` : `${key}`, 'render'));
    // tick(() => event(reference ? `${reference}.${key}` : `${key}`, 'render'));

    return true;
};

