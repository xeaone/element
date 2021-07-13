console.warn('oxe: need to handle delete property');

type task = (path?: string) => Promise<any>;
type tasks = task[];

const tick = Promise.resolve();

// const run = async function (tasks: tasks) {
//     let task;
//     while (task = tasks.shift()) {
//         task();
//         // await task();
//     }
// };

const set = function (task: task, tasks: tasks, path: string, target, property, value) {

    if (property === 'length') {
        return true;
    } else if (target[ property ] === value || `${target[ property ]}${value}` === 'NaNNaN') {
        return true;
    }

    // let initial;
    // if (!tasks.length) {
    //     initial = () => { };
    //     tasks.push(initial);
    // }

    if (target instanceof Array) {
        target[ property ] = observer(value, task, tasks, path ? `${path}[${property}]` : property);
    } else {
        target[ property ] = observer(value, task, tasks, path ? `${path}.${property}` : property);
    }

    tick.then(task.bind(null, path));
    // if (path) tasks.push(task.bind(null, path, length));
    // if (tasks[ 0 ] === initial) run(tasks);

    return true;
};

const observer = function (source: any, task: task, tasks: tasks = [], path: string = '') {
    let target;

    // let initial;
    // if (!tasks.length) {
    //     initial = () => { };
    //     tasks.push(initial);
    // }

    if (source instanceof Array) {
        target = source;

        for (let key = 0, l = source.length; key < l; key++) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}[${key}]` : `${key}`);
        }

        target = new Proxy(target, { set: set.bind(null, task, tasks, path) });
    } else if (typeof source === 'object') {
        target = source;

        for (const key in source) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : key);
        }

        target = new Proxy(target, { set: set.bind(null, task, tasks, path) });
    } else {
        target = source;
    }

    tick.then(task.bind(null, path));
    // if (path) tasks.push(task.bind(null, path));
    // if (tasks[ 0 ] === initial) run(tasks);

    return target;
};

export default observer;
