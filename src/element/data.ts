import tick from './tick';

type DataKeys = string | symbol;
type DataHandlers = 'render' | 'reset';

export const dataHas = function (target: any, key: DataKeys) {
    if (typeof key === 'string' && key.startsWith('$')) return false;
    return Reflect.has(target, key);
};

export const dataGet = function (event: any, reference: string, target: any, key: DataKeys, receiver: any): any {
    if (typeof key === 'symbol') return Reflect.get(target, key, receiver);
    if (!reference && key.startsWith('$')) return undefined;

    const value = Reflect.get(target, key, receiver);

    if (value && typeof value === 'object') {
        reference = reference ? `${reference}.${key}` : `${key}`;
        return new Proxy(value, {
            get: dataGet.bind(null, event, reference),
            set: dataSet.bind(null, event, reference),
            deleteProperty: dataDelete.bind(null, event, reference)
        });
    }

    return value;
};

export const dataDelete = function (event: any, reference: string, target: any, key: DataKeys) {
    if (typeof key === 'symbol') return Reflect.deleteProperty(target, key);
    if (!reference && key.startsWith('$')) return true;

    Reflect.deleteProperty(target, key);

    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'reset'));

    return true;
};

export const dataSet = function (event: any, reference: string, target: any, key: DataKeys, to: any, receiver: any) {
    if (typeof key === 'symbol') return Reflect.set(target, key, receiver);
    if (!reference && key.startsWith('$')) return true;

    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        tick(event.bind(null, reference, 'render'));
        tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return Reflect.set(target, key, to, receiver);
    } else if (from === to || isNaN(from) && to === isNaN(to)) {
        return Reflect.set(target, key, to, receiver);
    }

    Reflect.set(target, key, to, receiver);
    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));

    return true;
};

export const dataEvent = function (data: any, reference: string, type: DataHandlers) {
    for (const [ key, binders ] of data) {
        if (typeof key === 'string' && (key === reference || key.startsWith(`${reference}.`))) {
            if (binders) {
                for (const binder of binders) {
                    binder[ type ]();
                }
            }
        }
    }
};