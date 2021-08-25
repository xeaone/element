console.warn('oxe: need to handle delete property');

type task = (tasks: string[]) => Promise<any>;
type tasks = { path: string, type: string; }[];

const tick = Promise.resolve();

// const run = async function (tasks: tasks) {
//     let task;
//     while (task = tasks.shift()) {
//         task();
//     }
// };

const deleteProperty = function (task: task, tasks: tasks, path: string, target: any, key: any) {
    console.log('deleteProperty');

    const initial = !tasks.length;
    tasks.push({ path: path ? `${path}.${key}.` : `${key}.`, type: 'remove' });
    tasks.push({ path: path ? `${path}.${key}` : key, type: 'remove' });

    delete target[ key ];

    if (initial) tick.then(task.bind(null, tasks));

    return true;
};

const set = function (task: task, tasks: tasks, path: string, target: any, key, value) {

    if (key === 'length') {
        const initial = !tasks.length;
        tasks.push({ path, type: 'set' });
        tasks.push({ path: path ? `${path}.${key}` : key, type: 'set' });
        if (initial) tick.then(task.bind(null, tasks));
        return true;
    } else if (target[ key ] === value || `${target[ key ]}${value}` === 'NaNNaN') {
        return true;
    }

    const initial = !tasks.length;

    tasks.push({ path: path ? `${path}.${key}.` : `${key}.`, type: 'remove' });
    tasks.push({ path: path ? `${path}.${key}` : key, type: 'set' });

    target[ key ] = observer(value, task, tasks, path ? `${path}.${key}` : key);

    if (initial) tick.then(task.bind(null, tasks));

    return true;
};

const observer = function (source: any, task: task, tasks: tasks = [], path: string = '') {
    let target;

    const initial = !tasks.length;
    tasks.push({ path, type: 'set' });

    if (source?.constructor === Array) {
        target = [];

        for (let key = 0, length = source.length; key < length; key++) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : `${key}`);
        }

        target = new Proxy(target, {
            set: set.bind(null, task, tasks, path),
            deleteProperty: deleteProperty.bind(null, task, tasks, path)
        });

        tasks.push({ path: `${path}.length`, type: 'set' });

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

    if (initial) tick.then(task.bind(null, tasks));

    return target;
};

export default observer;
