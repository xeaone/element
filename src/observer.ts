type task = (path: string, type: string) => void;

const tick = Promise.resolve();

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

const deleteProperty = function (task: task, path: string, target: any, key: any) {

    if (target instanceof Array) {
        target.splice(key, 1);
    } else {
        Reflect.deleteProperty(target, key);
    }

    tick.then(task.bind(null, path ? `${path}.${key}` : `${key}`, 'unrender'));

    return true;
};

const set = function (task: task, path: string, target: any, key, to, receiver) {
    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        tick.then(task.bind(null, path, 'render'));
        tick.then(task.bind(null, path ? `${path}.${key}` : `${key}`, 'render'));
        return true;
    } else if (from === to || isNaN(from) && isNaN(to)) {
        return true;
    }

    Reflect.set(target, key, to, receiver);
    // Reflect.set(target, key, to);

    tick.then(task.bind(null, path ? `${path}.${key}` : `${key}`, 'render'));

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
