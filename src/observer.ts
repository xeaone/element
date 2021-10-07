
type task = (path: string) => Promise<any>;

const tick = Promise.resolve();

const deleteProperty = function (task: task, path: string, target: any, key: any) {

    delete target[ key ];
    // task(path ? `${path}.${key}` : `${key}`);
    tick.then(task.bind(this, path ? `${path}.${key}` : `${key}`));

    return true;
};

const set = function (task: task, path: string, target: any, key, value) {

    if (key === 'length') {
        // task(path);
        // task(path ? `${path}.${key}` : `${key}`);
        tick.then(task.bind(this, path));
        tick.then(task.bind(this, path ? `${path}.${key}` : `${key}`));
        return true;
    } else if (target[ key ] === value || `${target[ key ]}${value}` === 'NaNNaN') {
        return true;
    }

    target[ key ] = observer(value, task, path ? `${path}.${key}` : `${key}`);
    // task(path ? `${path}.${key}` : `${key}`);
    tick.then(task.bind(this, path ? `${path}.${key}` : `${key}`));

    return true;
};

const observer = function (source: any, task: task, path: string = '') {
    let target;

    if (source?.constructor === Array) {
        target = [];

        for (let key = 0, length = source.length; key < length; key++) {
            target[ key ] = observer(source[ key ], task, path ? `${path}.${key}` : `${key}`);
        }

        target = new Proxy(target, {
            set: set.bind(null, task, path),
            deleteProperty: deleteProperty.bind(null, task, path)
        });

    } else if (source?.constructor === Object) {
        target = {};

        for (let key in source) {
            target[ key ] = observer(source[ key ], task, path ? `${path}.${key}` : `${key}`);
        }

        target = new Proxy(target, {
            set: set.bind(null, task, path),
            deleteProperty: deleteProperty.bind(null, task, path)
        });

    } else {
        target = source;
    }

    return target;
};

export default observer;
