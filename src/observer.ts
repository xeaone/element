
type task = (path: string) => Promise<void>;
type tasks = task[];

const run = async function (tasks: tasks) {
    let task;
    while (task = tasks.shift()) {
        task();
    }
};

// const set = function (task: task, path: string, target, property, value) {
const set = function (task: task, tasks: tasks, path: string, target, property, value) {

    if (property === 'length') {
        target[ property ] = value;
        task(path);
        return true;
    } else if (target[ property ] === value || `${target[ property ]}${value}` === 'NaNNaN') {
        return true;
    }

    if (target?.constructor === Array) {
        path = path ? `${path}[${property}]` : property;
    } else {
        path = path ? `${path}.${property}` : property;
    }

    target[ property ] = observer(value, task, tasks, path);
    // target[ property ] = create(value, task, tasks, path);
    // target[ property ] = create(value, task, [], path);

    return true;
};

const observer = function (source: any, task: task, tasks: tasks = [], path: string = '') {
    let target;

    const initial = path ? task.bind(null, path) : () => undefined;
    tasks.push(initial);

    if (source?.constructor === Array) {
        target = source;
        // target = [];

        for (let key = 0; key < source.length; key++) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}[${key}]` : `${key}`);
        }

        target = new Proxy(target, { set: set.bind(null, task, tasks, path) });
        // target = new Proxy(target, { set: set.bind(null, task, path) });
    } else if (source?.constructor === Object) {
        target = source;
        // target = {};

        for (let key in source) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : key);
        }

        target = new Proxy(target, { set: set.bind(null, task, tasks, path) });
        // target = new Proxy(target, { set: set.bind(null, task, path) });
    } else {
        target = source;
    }

    if (tasks[ 0 ] === initial) {
        run(tasks);
    }

    return target;
};

export default observer;
