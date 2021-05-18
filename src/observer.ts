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

const set = function (tasks: task[], handler, path, target, property, value) {

    if (property === 'length') {
        property = '';
        path = path.slice(0, -1);
    } else if (target[ property ] === value) {
        return true;
    }

    target[ property ] = create(value, handler, path + property, tasks);

    if (tasks.length) run(tasks);

    return true;
};

const create = function (source: any, handler: handler, path?: string, tasks?: task[]) {
    path = path || '';
    tasks = tasks || [];

    tasks.push(handler.bind(null, source, path));

    // if (!isObject(source) && !isArray(source)) {

    //     if (!path && tasks.length) {
    //         Promise.resolve().then(() => {
    //             let task; while (task = tasks.shift()) task();
    //         }).catch(console.error);
    //     }

    //     return source;
    // }
    // path = path ? path + '.' : '';

    let isNative = false;

    if (isArray(source)) {
        path = path ? path + '.' : '';

        for (let key = 0; key < source.length; key++) {
            tasks.push(handler.bind(null, source[ key ], path + key));
            source[ key ] = create(source[ key ], handler, path + key, tasks);
        }
    } else if (isObject(source)) {
        path = path ? path + '.' : '';

        for (let key in source) {
            tasks.push(handler.bind(null, source[ key ], path + key));
            source[ key ] = create(source[ key ], handler, path + key, tasks);
        }
    } else {
        isNative = true;
    }

    if (!path && tasks.length) run(tasks);
    if (isNative) return source;

    return new Proxy(source, { set: set.bind(set, tasks, handler, path) });
};

const clone = function (source: any, handler: handler, path?: string, tasks?: task[]) {
    path = path || '';
    tasks = tasks || [];

    tasks.push(handler.bind(null, source, path));

    // if (!isObject(source) && !isArray(source)) {

    //     if (!path && tasks.length) {
    //         Promise.resolve().then(() => {
    //             let task; while (task = tasks.shift()) task();
    //         }).catch(console.error);
    //     }

    //     return source;
    // }
    // path = path ? path + '.' : '';

    let target;
    let isNative = false;

    if (isArray(source)) {
        target = [];
        path = path ? path + '.' : '';

        for (let key = 0; key < source.length; key++) {
            tasks.push(handler.bind(null, source[ key ], `${path}${key}`));
            target[ key ] = create(source[ key ], handler, `${path}${key}`, tasks);
        }
    } else if (isObject(source)) {
        target = {};
        path = path ? path + '.' : '';

        for (let key in source) {
            tasks.push(handler.bind(null, source[ key ], `${path}${key}`));
            target[ key ] = create(source[ key ], handler, `${path}${key}`, tasks);
        }
    } else {
        isNative = true;
    }

    if (!path && tasks.length) run(tasks);
    if (isNative) return source;

    return new Proxy(target, { set: set.bind(set, tasks, handler, path) });
};

export default {
    // get,
    set, create, clone
};
