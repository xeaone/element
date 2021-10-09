type task = (path: string) => Promise<any>;

const get = function (task: task, path: string, target: any, key: any, receiver) {
    if (target[ key ] && typeof target[ key ] === 'object') {
        path = path ? `${path}.${key}` : `${key}`;
        return new Proxy(Reflect.get(target, key, receiver), {
            get: get.bind(null, task, path),
            set: set.bind(null, task, path),
            deleteProperty: deleteProperty.bind(null, task, path)
        });
    } else {
        // return target[ key ];
        return Reflect.get(target, key, receiver);
    }
};

const deleteProperty = function (task: task, path: string, target: any, key: any) {
    // delete target[ key ];
    Reflect.deleteProperty(target, key);
    task(path ? `${path}.${key}` : `${key}`);
    return true;
};

const set = function (task: task, path: string, target: any, key, value, receiver) {

    if (key === 'length') {
        task(path);
        task(path ? `${path}.${key}` : `${key}`);
        return true;
    } else if (Reflect.get(target, key, receiver) === value || target[ key ] === value) {
        return true;
    }

    // target[ key ] = value;
    // target[ key ] = observer(value, task, path ? `${path}.${key}` : `${key}`);
    Reflect.set(target, key, value, receiver);
    task(path ? `${path}.${key}` : `${key}`);

    return true;
};

const observer = function (source: any, task: task, path: string = '') {

    return new Proxy(source, {
        get: get.bind(null, task, path),
        set: set.bind(null, task, path),
        deleteProperty: deleteProperty.bind(null, task, path)
    });

    // if (source && typeof source === 'object') {

    //     const target = new Proxy(source, {
    //         set: set.bind(null, task, path),
    //         deleteProperty: deleteProperty.bind(null, task, path)
    //     });

    //     for (const key in source) {
    //         // target[ key ] = observer(source[ key ], task, path ? `${path}.${key}` : `${key}`);
    //         const descriptor = Object.getOwnPropertyDescriptor(source, key);
    //         if ('value' in descriptor) {
    //             descriptor.value = observer(descriptor.value, task, path ? `${path}.${key}` : `${key}`);
    //             Object.defineProperty(target, key, descriptor);
    //         } else {
    //             descriptor.get = function (g, t, p) {
    //                 return observer(g(), t, p);
    //             }.bind(target, descriptor.get.bind(target), task, path ? `${path}.${key}` : `${key}`);
    //             descriptor.set = function (s, t, p, v) {
    //                 return observer(s(v), t, p);
    //             }.bind(target, descriptor.set.bind(target), task, path ? `${path}.${key}` : `${key}`);
    //             Object.defineProperty(target, key, descriptor);
    //         }
    //     }

    //     return target;
    // } else {
    //     return source;
    // }

};

export default observer;
