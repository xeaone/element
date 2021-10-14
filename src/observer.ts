type task = (path: string, type: string) => Promise<any>;

const tick = Promise.resolve();

const change = async function (task, from, to, type, path) {
    const tasks = [ task.bind(null, path, type) ];
    await compare(task, from, to, path, tasks);
    return Promise.all(tasks.map(t => t()));
};

const compare = async function (task: task, from: any, to: any, path: string, tasks: task[]) {
    const compares = [];

    const fromIsObject = from && typeof from === 'object';
    const toIsObject = to && typeof to === 'object';
    if (!fromIsObject && !toIsObject) return;

    const fromKeys = fromIsObject ? Object.keys(from) : [];
    const toKeys = toIsObject ? Object.keys(to) : [];

    for (const key of fromKeys) {
        const index = toKeys?.indexOf(key) ?? -1;
        const child = path ? `${path}.${key}` : `${key}`;
        if (index !== -1) {
            console.log(child, index, key, JSON.stringify(from[ key ]), JSON.stringify(to[ key ]));
            toKeys.splice(index, 1);
            tasks.push(task.bind(null, child, 'render'));
            compares.push(compare(task, from[ key ], to[ key ], child, tasks));
        } else {
            // console.log(child, index, key, JSON.stringify(from[ key ]));
            tasks.push(task.bind(null, child, 'unrender'));
            compares.push(compare(task, from[ key ], undefined, child, tasks));
        }
    }

    for (const key of toKeys) {
        const child = path ? `${path}.${key}` : `${key}`;
        // console.log('rest', child, key, JSON.stringify(to[ key ]));
        tasks.push(task.bind(null, child, 'render'));
        compares.push(compare(task, undefined, to[ key ], child, tasks));
    }

    return Promise.all(compares);
};

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
    const value = Reflect.get(target, key, receiver);
    Reflect.deleteProperty(target, key);
    tick.then(change.bind(null, task, value, undefined, 'unrender', path ? `${path}.${key}` : `${key}`));
    // change(task, value, undefined, 'unrender', path ? `${path}.${key}` : `${key}`);
    // task(path ? `${path}.${key}` : `${key}`, 'unrender');
};

const set = function (task: task, path: string, target: any, key, to, receiver) {
    const from = Reflect.get(target, key, receiver);

    if (key === 'length') {
        // task(path, 'render');
        // task(path ? `${path}.${key}` : `${key}`, 'render');
        tick.then(change.bind(null, task, from, to, 'render', path));
        tick.then(change.bind(null, task, from, to, 'render', path ? `${path}.${key}` : `${key}`));
        return true;
    } else if (from === to) {
        return true;
    }

    Reflect.set(target, key, to, receiver);
    tick.then(change.bind(null, task, from, to, 'render', path ? `${path}.${key}` : `${key}`));
    // change(task, from, to, 'render', path ? `${path}.${key}` : `${key}`);
    // task(path ? `${path}.${key}` : `${key}`, 'render');

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
