console.warn('oxe: need to handle delete property');

type task = (path?: string) => Promise<any>;
type tasks = task[];

const $path = Symbol('$path');
const $task = Symbol('$task');
const $tasks = Symbol('$tasks');
const $proxy = Symbol('$proxy');

// const tick = Promise.resolve();

const run = async function (tasks: tasks) {
    let task;
    while (task = tasks.shift()) {
        await task();
    }
};

const set = function (target: any, key: any, value: any, receiver: any) {
    if (key === $path) return true;
    if (key === $task) return true;
    if (key === $tasks) return true;
    if (key === $proxy) return true;
    if (key === 'length') return target[ $tasks ].push(target[ $task ].bind(null, target[ $path ]));

    const current = target[ key ];
    if (current !== current && value !== value) return true;
    if (current === value) return true;

    const path = target[ $path ] ? `${target[ $path ]}.${key}` : `${key}`;
    const initial = !target[ $tasks ].length;
    target[ $tasks ].push(target[ $task ].bind(null, path));

    if (value && typeof value === 'object' && !value[ $proxy ]) {

        value[ $path ] = path;
        value[ $proxy ] = true;
        value[ $task ] = target[ $task ];
        value[ $tasks ] = target[ $tasks ];
        target[ key ] = new Proxy(value, handler);
        // const proxy = new Proxy(value, handler);
        // target[ key ] = Object.assign(proxy, value);

    } else {
        target[ key ] = value;
    }

    if (initial) run(target[ $tasks ]);

    return true;
};

const handler = { set };

const observer = function (source: any, task: task) {
    // source[ $path ] = '';
    // source[ $tasks ] = [];
    // source[ $task ] = task;
    // source[ $proxy ] = true;
    // return new Proxy(source, { set });

    const proxy = new Proxy({
        [ $path ]: '',
        [ $tasks ]: [],
        [ $task ]: task,
        [ $proxy ]: true
    }, handler);
    Object.assign(proxy, source);
    return proxy;
};

export default observer;
