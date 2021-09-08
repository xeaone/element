
type task = (path: string) => Promise<any>;
// type task = (tasks: string[]) => Promise<any>;
type tasks = string[];

const tick = Promise.resolve();

const deleteProperty = function (task: task, tasks: tasks, path: string, target: any, key: any) {

    // const initial = !tasks.length;
    // tasks.push(path ? `${path}.${key}` : `${key}`);

    delete target[ key ];
    // tick.then(task.bind(null, path ? `${path}.${key}` : key));
    task(path ? `${path}.${key}` : `${key}`);

    // if (initial) task(tasks.splice(0, tasks.length));

    return true;
};

const set = function (task: task, tasks: tasks, path: string, target: any, key, value) {

    if (key === 'length') {

        // const initial = !tasks.length;
        // tasks.push(path);
        // tasks.push(path ? `${path}.${key}` : `${key}`);
        // if (initial) task(tasks.splice(0, tasks.length));

        task(path);
        task(path ? `${path}.${key}` : `${key}`);

        // tick.then(task.bind(null, path));
        // tick.then(task.bind(null, path ? `${path}.${key}` : `${key}`));

        return true;
    } else if (target[ key ] === value || `${target[ key ]}${value}` === 'NaNNaN') {
        return true;
    }

    // const initial = !tasks.length;
    // tasks.push(path ? `${path}.${key}` : `${key}`);

    target[ key ] = observer(value, task, tasks, path ? `${path}.${key}` : `${key}`);
    task(path ? `${path}.${key}` : `${key}`);
    // tick.then(task.bind(null, path ? `${path}.${key}` : `${key}`));

    // if (initial) task(tasks.splice(0, tasks.length));

    return true;
};

const observer = function (source: any, task: task, tasks: tasks = [], path: string = '') {
    let target;

    // const initial = !tasks.length;

    if (source?.constructor === Array) {
        target = [];

        for (let key = 0, length = source.length; key < length; key++) {
            // tasks.push(path ? `${path}.${key}` : `${key}`);
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : `${key}`);
            // task(path ? `${path}.${key}` : `${key}`);
            // tick.then(task.bind(null, path ? `${path}.${key}` : `${key}`));
        }

        target = new Proxy(target, {
            set: set.bind(null, task, tasks, path),
            deleteProperty: deleteProperty.bind(null, task, tasks, path)
        });

    } else if (source?.constructor === Object) {
        target = {};

        for (const key in source) {
            // tasks.push(path ? `${path}.${key}` : `${key}`);
            target[ key ] = observer(source[ key ], task, tasks, path ? `${path}.${key}` : `${key}`);
            // task(path ? `${path}.${key}` : `${key}`);
            // tick.then(task.bind(null, path ? `${path}.${key}` : `${key}`));
        }

        target = new Proxy(target, {
            set: set.bind(null, task, tasks, path),
            deleteProperty: deleteProperty.bind(null, task, tasks, path)
        });

    } else {
        target = source;
    }

    // if (initial) task(tasks.splice(0, tasks.length));

    return target;
};

export default observer;
