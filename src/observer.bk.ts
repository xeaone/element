console.warn('oxe: need to handle delete property');

type task = (path: string, index?: number, key?: string, message?: string) => Promise<any>;

const tick = Promise.resolve();

const deleteProperty = function (task, path, target: any, key: any) {

    const current = target[ key ];
    if (typeof current === 'object') {
        for (const k in current) {
            delete current[ k ];
        }
    }

    delete target[ key ];

    tick.then(() => task(path ? `${path}.${key}` : `${key}`, 'delete'));

    return true;
};

const set = function (task, path, target: any, key: any, value: any) {

    if (key === 'length') {
        tick.then(() => task(path, 'length'));
        return true;
    }

    const current = target[ key ];
    if (current !== current && value !== value) return true; // NaN check
    if (current === value) return true;

    if (value && typeof value === 'object') {

        if (typeof current === 'object') {

            for (const k in current) {
                if (!(k in value)) delete current[ k ];
            }

            // tick.then(() => task(path ? `${path}.${key}` : `${key}`, 'delete'));
        }

        delete target[ key ];

        target[ key ] = new Proxy(value.constructor(), {
            set: set.bind(null, task, path ? `${path}.${key}` : `${key}`),
            deleteProperty: deleteProperty.bind(null, task, path ? `${path}.${key}` : `${key}`)
        });

        // Object.assign(target[ key ], value);

        for (const k in value) {
            target[ key ][ k ] = value[ k ];
        }

    } else {
        target[ key ] = value;
    }

    tick.then(() => task(path ? `${path}.${key}` : `${key}`, 'set'));
    // tick.then(task.bind(null, path ? `${path}.${key}` : `${key}`));

    return true;
};

const observer = function (source: any, task: task) {
    const clone = source.constructor();
    const proxy = new Proxy(clone, {
        set: set.bind(null, task, ''),
        deleteProperty: deleteProperty.bind(null, task, '')
    });
    Object.assign(proxy, source);
    return proxy;
};

export default observer;
