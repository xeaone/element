import { isArray, isObject } from './tool';

type task = () => void;
type handler = (path: string) => Promise<void>;

// const methods = [ 'push', 'pop', 'splice', 'shift', 'unshift', 'reverse' ];
// const get = function (tasks, handler, path, target, property) {
//     if (isArray(target) && methods.indexOf(property) !== -1) {
//         console.log('get', path);
//         tasks.push(handler.bind(null, target, path.slice(0, -1)));
//     }
//     return target[ property ];
// };

type option = {
    target?: any;
    tasks: task[];
    // paths: string[];
    handler: handler;
};

const run = async function (tasks: task[]) {
    let task;
    while (task = tasks.shift()) {
        task();
    }
};

const set = function (handler: handler, path: string, root: any, target, property, value) {

    if (property === 'length') {
        target[ property ] = value;
        handler(path);
        // tasks.push(handler.bind(null, path));
        // run(tasks);
        return true;
    } else if (target[ property ] === value || `${target[ property ]}${value}` === 'NaNNaN') {
        // } else if (target[ property ] === value) {
        return true;
    }

    if (target?.constructor === Array) {
        path = path ? `${path}[${property}]` : property;
    } else {
        path = path ? `${path}.${property}` : property;
    }

    // const task = handler.bind(null, path);
    // const tasks = [ task ];
    target[ property ] = create(value, handler, [], path, root);
    // target[ property ] = create(value, handler, tasks, path, root);
    // run(tasks);

    return true;
};

let w = 0;
let r = 0;

const create = function (source: any, handler: handler, tasks: task[], path: string, root: any) {
    let target;

    const task = path ? handler.bind(null, path) : () => undefined;
    tasks.push(task);

    if (source?.constructor === Array) {
        target = [];
        if (!root) root = target;

        for (let key = 0; key < source.length; key++) {
            target[ key ] = create(source[ key ], handler, tasks, path ? `${path}[${key}]` : `${key}`, root);
        }

        target = new Proxy(target, { set: set.bind(null, handler, path, root) });
    } else if (source?.constructor === Object) {
        target = {};
        if (!root) root = target;

        for (let key in source) {
            target[ key ] = create(source[ key ], handler, tasks, path ? `${path}.${key}` : key, root);
        }

        target = new Proxy(target, { set: set.bind(null, handler, path, root) });
    } else {
        target = typeof source === 'function' ? source.bind(root) : source;
    }

    if (tasks[ 0 ] === task) {
        console.log('tasks', tasks.length);
        run(tasks);
        console.log('tasks', tasks.length);
        r++;
        console.log('resolved', r);
    } else {
        w++;
        console.log('waiting', w);
    }

    return target;
};

const observe = function (source: any, handler: handler) {
    const data = create(source, handler, [], '', undefined);
    return data;
};

export default {
    // get,
    set, create, observe

};
