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

const set = function (option: option, path, target, property, value) {

    if (property === 'length') {
        path = path.slice(0, -1);
        option.tasks.push(option.handler.bind(null, value, path));
        // option.tasks.push(option.handler.bind(null, target, path));
        run(option.tasks);
        // target[ property ] = value;
        return true;
    } else if (target[ property ] === value) {
        return true;
    }

    if (isArray(target)) {
        path = `${path.slice(0, -1)}[${property}]`;
    } else {
        path = path + property;
    }

    target[ property ] = create(value, option, path);

    run(option.tasks);

    return true;
};

const create = function (source: any, option: option, path: string, setup?: boolean) {

    // if (path && !option.paths.includes(path)) option.paths.push(path);

    let target;

    if (source instanceof Array) {
        target = setup ? [] : source;

        option.tasks.push(option.handler.bind(null, target, path));

        if (!option.target) option.target = target;
        path = path ? path + '.' : '';

        for (let key = 0; key < source.length; key++) {
            target[ key ] = create(source[ key ], option, path + key, setup);
        }

        target = new Proxy(target, { set: set.bind(set, option, path) });
    } else if (isObject(source)) {
        target = setup ? {} : source;

        option.tasks.push(option.handler.bind(null, target, path));

        if (!option.target) option.target = target;
        path = path ? path + '.' : '';

        for (let key in source) {
            target[ key ] = create(source[ key ], option, path + key, setup);
        }

        target = new Proxy(target, { set: set.bind(set, option, path) });
    } else {
        target = typeof source === 'function' ? source.bind(option.target) : source;
        option.tasks.push(option.handler.bind(null, target, path));
    }

    run(option.tasks);

    return target;
};

const observe = function (source: any, handler: handler) {
    const tasks: task[] = [];
    // const paths: string[] = [];
    const option: option = { tasks, handler };
    // const option: option = { tasks, paths, handler };

    const data = create(source, option, '', true);
    // Object.defineProperty(data, '_paths', { value: paths });
    return data;
};

export default {
    // get,
    set, create, observe

};
