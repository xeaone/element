type task = (path: string, type: string) => Promise<any>;

const get = function (task: task, path: string, target: any, key: any, receiver) {
    const value = Reflect.get(target, key, receiver);
    if (value && typeof value === 'object') {
        path = path ? `${path}.${key}` : `${key}`;
        return new Proxy(value, {
            get: get.bind(null, task, path),
            set: set.bind(null, task, path),
            deleteProperty: deleteProperty.bind(null, task, path)
        });
    } else {
        return value;
    }
};

const deleteProperty = function (task: task, path: string, target: any, key: any, receiver) {
    Reflect.deleteProperty(target, key);
    task(path ? `${path}.${key}` : `${key}`, 'unrender');
};

const set = function (task: task, path: string, target: any, key, to, receiver) {
    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        task(path, 'render');
        task(path ? `${path}.${key}` : `${key}`, 'render');
        return true;
    } else if (from === to) {
        return true;
    }

    Reflect.set(target, key, to, receiver);

    // console.log(path, key, from, to);

    // if (from && typeof from === 'object') {
    //     if (to && typeof to === 'object') {
    //         const tasks = [];
    //         for (const child in from) {
    //             if (!(child in to)) {
    //                 tasks.push(task(path ? `${path}.${key}.${child}` : `${key}.${child}`, 'unrender'));
    //             }
    //         }
    //         Promise.all(tasks).then(() => task(path ? `${path}.${key}` : `${key}`, 'render'));
    //     } else {
    //         task(path ? `${path}.${key}` : `${key}`, 'unrender').then(() => task(path ? `${path}.${key}` : `${key}`, 'render'));
    //     }
    // } else {
    //     task(path ? `${path}.${key}` : `${key}`, 'render');
    // }

    task(path ? `${path}.${key}` : `${key}`, 'render');

    return true;
};

const observer = function (source: any, task: task, path: string = '') {
    return new Proxy(source, {
        get: get.bind(null, task, path),
        set: set.bind(null, task, path),
        deleteProperty: deleteProperty.bind(null, task, path)
    });
};

export default observer;
