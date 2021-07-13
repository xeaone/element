console.warn('oxe: need to handle delete property');

type task = (path?: string) => Promise<any>;
type tasks = task[];

// const tick = Promise.resolve();

const run = async function (tasks: tasks) {
    let task;
    while (task = tasks.shift()) {
        await task();
    }
};

const set = function (task: task, tasks: tasks, path: string, target, property, value) {

    if (property === 'length') {
        return true;
    } else if (target[ property ] === value || `${target[ property ]}${value}` === 'NaNNaN') {
        return true;
    }

    const initial = !tasks.length;
    tasks.push(task.bind(null, path));

    if (target?.constructor === Array) {
        target[ property ] = observer(value, task, tasks, path ? `${path}[${property}]` : property);
    } else {
        target[ property ] = observer(value, task, tasks, path ? `${path}.${property}` : property);
    }

    if (initial) run(tasks);
    // tick.then(task.bind(null, path));

    return true;
};

const observer = function (source: any, task: task, tasks: tasks = [], path: string = '') {
    let target;

    const initial = !tasks.length;
    tasks.push(task.bind(null, path));

    if (source?.constructor === Array) {
        target = source;

        for (let key = 0; key < source.length; key++) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}[${key}]` : `${key}`);
        }

        target = new Proxy(target, { set: set.bind(null, task, tasks, path) });
    } else if (source?.constructor === Object) {
        target = source;

        for (const key in source) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : key);
        }

        target = new Proxy(target, { set: set.bind(null, task, tasks, path) });
    } else {
        target = source;
    }

    if (initial) run(tasks);
    // tick.then(task.bind(null, path));

    return target;
};

export default observer;
