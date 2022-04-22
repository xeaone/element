import tick from './tick.ts';

// type DataEvent<T> = T extends (arg: infer T) => any ? T : never;
type DataKeys = string | number | symbol;
type DataHandlers = 'render' | 'unrender';

export const dataGet = function (event: any, reference: string, target: any, key: DataKeys, receiver?: any): any {
    if (typeof key === 'symbol') return target[ key ];
    // if (key === 'x') return { reference };
    const value = Reflect.get(target, key);
    // const value = Reflect.get(target, key, receiver);

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
    if (typeof key === 'symbol') return true;

    if (target instanceof Array) {
        target.splice((key as number), 1);
    } else {
        Reflect.deleteProperty(target, key);
    }

    tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'unrender'));

    return true;
};

export const dataSet = function (event: any, reference: string, target: any, key: DataKeys, to: any, receiver?: any) {
    if (typeof key === 'symbol') return true;

    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        tick(event.bind(null, reference, 'render'));
        tick(event.bind(null, reference ? `${reference}.${key}` : `${key}`, 'render'));
        return true;
    } else if (from === to || isNaN(from) && to === isNaN(to)) {
        return true;
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

