console.warn('oxe: need to handle delete property');

type task = (path?: string) => Promise<any>;
type tasks = task[];

// const tick = Promise.resolve();

const run = async function (tasks: tasks) {
    let task;
    while (task = tasks.shift()) {
        await task();
    }
};

const set = function (target: any, key: string, value: any) {
    if (key === '$path') return true;
    if (key === '$task') return true;
    if (key === '$tasks') return true;
    if (key === '$proxy') return true;
    if (`${target[ key ]}${value}` === 'NaNNaN') return true;

    if (key === 'length') {
        // target.$tasks.unshift(target.$task.bind(null, target.$path));
        target.$tasks.push(target.$task.bind(null, target.$path));
        return true;
    }

    if (target[ key ] === value) return true;

    let path;
    const isArray = target.constructor === Array;
    if (isArray) path = target.$path ? `${target.$path}[${key}]` : `${key}`;
    else path = target.$path ? `${target.$path}.${key}` : `${key}`;

    const initial = !target.$tasks.length;
    target.$tasks.push(target.$task.bind(null, path));

    if (value !== null && value !== undefined && typeof value === 'object' && !value.$proxy) {
        const copy = value.constructor();
        copy.$proxy = true;
        copy.$path = path;
        copy.$task = target.$task;
        copy.$tasks = target.$tasks;
        target[ key ] = Object.assign(new Proxy(copy, { set }), value);
        // target[ key ] = new Proxy(value, { set });
    } else {
        target[ key ] = value;
    }

    if (initial) run(target.$tasks);

    return true;
};

const observer = function (source: any, task: task) {
    const result = new Proxy({ $task: task, $tasks: [], $path: '' }, { set });
    Object.assign(result, source);
    return result;
};

export default observer;
