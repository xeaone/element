console.warn('oxe: need to handle delete property');

type task = (path?: string) => Promise<any>;
type tasks = task[];

const tick = Promise.resolve();

const run = async function (tasks: tasks) {
    let task;
    while (task = tasks.shift()) {
        task();
    }
};

// const unobserve = function (source: any, task: task, tasks: tasks, path: string) {
//     if (typeof source === 'object') {
//     }
// };

const deleteProperty = function (task: task, tasks: tasks, path: string, target: any, key: any) {

    const initial = !tasks.length;
    tasks.push(task.bind(null, path));

    const current = target[ key ];
    if (typeof current === 'object') {
        for (const child in current) {
            delete current[ child ];
        }
    }

    delete target[ key ];

    if (initial) tick.then(run.bind(null, tasks));

    return true;
};

const set = function (task: task, tasks: tasks, path: string, target: any, key, value) {

    if (key === 'length') {
        const initial = !tasks.length;
        tasks.push(task.bind(null, path ? `${path}.${key}` : key));
        if (initial) tick.then(run.bind(null, tasks));
        return true;
    } else if (target[ key ] === value || `${target[ key ]}${value}` === 'NaNNaN') {
        return true;
    }

    const initial = !tasks.length;
    tasks.push(task.bind(null, path));

    const current = target[ key ];
    if (typeof current === 'object') {
        for (const child in current) {
            if (!(child in value)) delete current[ child ];
        }
    }

    if (value?.constructor === Array) {
        tasks.push(task.bind(null, path ? `${path}.${key}.length` : `${key}.length`));
    }

    target[ key ] = observer(value, task, tasks, path ? `${path}.${key}` : key);

    if (initial) tick.then(run.bind(null, tasks));

    return true;
};

const observer = function (source: any, task: task, tasks: tasks = [], path: string = '') {
    let target;

    const initial = !tasks.length;
    tasks.push(task.bind(null, path));

    if (source?.constructor === Array) {
        target = [];

        for (let key = 0, length = source.length; key < length; key++) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : `${key}`);
        }

        target = new Proxy(target, {
            set: set.bind(null, task, tasks, path),
            deleteProperty: deleteProperty.bind(null, task, tasks, path)
        });
    } else if (source?.constructor === Object) {
        target = {};

        for (const key in source) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : key);
        }

        target = new Proxy(target, {
            set: set.bind(null, task, tasks, path),
            deleteProperty: deleteProperty.bind(null, task, tasks, path)
        });
    } else {
        target = source;
    }

    if (initial) tick.then(run.bind(null, tasks));

    return target;
};

export default observer;
