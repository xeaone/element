
type task = (path?: string) => void;
type tasks = task[];

const run = async function (tasks: tasks) {
    // let task = tasks.shift();
    // if (task) await task();
    let task;
    while (task = tasks.shift()) {
        // task();
        await task();
    }
};

const methods = [ 'splice', 'pop', 'push', 'shift', 'unshift' ];

// const get = function (task: task, tasks: tasks, path: string, target, property) {
//     if (target.constructor === Array && methods.includes(property)) {
//         const method = target[ property ];
//         return function (...args) {
//             task(path);
//             method.apply(target, args);
//         };
//     }

//     return target[ property ];
// };

const set = function (task: task, tasks: tasks, path: string, target, property, value) {

    if (property === 'length') {
        // const old = target[ property ];
        // console.log(old, value, property);
        // if (tasks.length === 0) {
        //     console.log('LENGTH');
        //     setTimeout(() => {
        //         task(path);
        //     });
        // }
        return true;
    } else if (target[ property ] === value || `${target[ property ]}${value}` === 'NaNNaN') {
        return true;
    }

    let initial;
    if (!tasks.length) {
        initial = () => { };
        tasks.push(initial);
    };

    if (target?.constructor === Array) {
        target[ property ] = observer(value, task, tasks, path ? `${path}[${property}]` : property);
    } else {
        target[ property ] = observer(value, task, tasks, path ? `${path}.${property}` : property);
    }

    if (path) tasks.push(task.bind(null, path));
    if (tasks[ 0 ] === initial) run(tasks);

    return true;
};

const observer = function (source: any, task: task, tasks: tasks = [], path: string = '') {
    let target;

    let initial;
    if (!tasks.length) {
        initial = () => { };
        tasks.push(initial);
    }

    if (source?.constructor === Array) {
        target = source;

        for (let key = 0; key < source.length; key++) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}[${key}]` : `${key}`);
        }

        target = new Proxy(target, {
            set: set.bind(null, task, tasks, path),
            // get: get.bind(null, task, tasks, path)
        });
    } else if (source?.constructor === Object) {
        target = source;

        for (let key in source) {
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : key);
        }

        target = new Proxy(target, {
            set: set.bind(null, task, tasks, path),
            // get: get.bind(null, task, tasks, path)
        });
    } else {
        target = source;
    }

    if (path) tasks.push(task.bind(null, path));
    if (tasks[ 0 ] === initial) run(tasks);

    // if (path) Promise.resolve().then(task.bind(null, path)).then(run.bind(null, tasks));
    // else Promise.resolve().then(run.bind(null, tasks));


    return target;
};

export default observer;
