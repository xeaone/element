import { isArray, isObject } from './tool';

type task = () => void;
type handler = () => void;

// const methods = [ 'push', 'pop', 'splice', 'shift', 'unshift', 'reverse' ];
// const get = function (tasks, handler, path, target, property) {
//     if (isArray(target) && methods.indexOf(property) !== -1) {
//         console.log('get', path);
//         tasks.push(handler.bind(null, target, path.slice(0, -1)));
//     }
//     return target[ property ];
// };

const run = async function (tasks: task[]) {
    let task;
    while (task = tasks.shift()) {
        task();
    }
};

const set = function (tasks: task[], handler, original, path, target, property, value) {

    if (property === 'length') {
        property = '';
        path = path.slice(0, -1);
        tasks.push(handler.bind(null, value, path));
        run(tasks);
        return true;
    } else if (target[ property ] === value) {
        return true;
    }

    target[ property ] = create(value, handler, original, path + property, tasks);

    run(tasks);

    return true;
};

const create = function (source: any, handler: handler, original?: any, path?: string, tasks?: task[]) {
    let init = path ? false : true;

    path = path || '';
    tasks = tasks || [];

    tasks.push(handler.bind(null, source, path));

    if (isArray(source)) {
        path = path ? path + '.' : '';
        // original = original || source;
        original = init ? new Proxy(source, { set: set.bind(set, tasks, handler, original, path) }) : original;

        for (let key = 0; key < source.length; key++) {
            source[ key ] = create(source[ key ], handler, original, path + key, tasks);
        }
    } else if (isObject(source)) {
        path = path ? path + '.' : '';
        original = init ? new Proxy(source, { set: set.bind(set, tasks, handler, original, path) }) : original;

        for (let key in source) {
            source[ key ] = create(source[ key ], handler, original, path + key, tasks);
        }
    } else {
        if (!path) run(tasks);
        return typeof source === 'function' ? source.bind(original) : source;
    }

    return init ? original : new Proxy(source, { set: set.bind(set, tasks, handler, original, path) });
};

const clone = function (source: any, handler: handler, original?: any, path?: string, tasks?: task[]) {
    let init = path ? false : true;

    path = path || '';
    tasks = tasks || [];

    tasks.push(handler.bind(null, source, path));

    let target;

    if (isArray(source)) {
        target = [];
        path = path ? path + '.' : '';
        // original = original || target;
        original = init ? new Proxy(target, { set: set.bind(set, tasks, handler, original, path) }) : original;

        for (let key = 0; key < source.length; key++) {
            target[ key ] = clone(source[ key ], handler, original, path + key, tasks);
        }
    } else if (isObject(source)) {
        target = {};
        path = path ? path + '.' : '';
        // original = original || target;
        original = init ? new Proxy(target, { set: set.bind(set, tasks, handler, original, path) }) : original;

        for (let key in source) {
            target[ key ] = clone(source[ key ], handler, original, path + key, tasks);
        }
    } else {
        if (!path) run(tasks);
        return typeof source === 'function' ? source.bind(original) : source;
    }

    if (!path) run(tasks);

    return init ? original : new Proxy(target, { set: set.bind(set, tasks, handler, original, path) });
    // return new Proxy(target, { set: set.bind(set, tasks, handler, original, path) });
};

export default {
    // get,
    set, create, clone
};
