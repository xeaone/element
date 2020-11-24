
const methods = [ 'push', 'pop', 'splice', 'shift', 'unshift', 'reverse' ];

const get = function (tasks, handler, path, target, property) {

    if (target instanceof Array && methods.indexOf(property) !== -1) {
        // console.log(path.slice(0, -1));
        tasks.push(handler.bind(null, target, path.slice(0, -1)));
    }

    return target[property];
};

const set = function (tasks, handler, path, target, property, value) {

    // if (property === 'length') {
    //     return true;
    // }

    if (target[property] === value) {
        return true;
    }

    target[property] = create(value, handler, path + property, tasks);

    if (tasks.length) {
        Promise.resolve().then(() => {
            let task; while (task = tasks.shift()) task();
        }).catch(console.error);
    }

    return true;
};

const create = function (source, handler, path, tasks) {
    path = path || '';
    tasks = tasks || [];

    tasks.push(handler.bind(null, source, path));

    if (source instanceof Object === false && source instanceof Array === false) {

        if (!path && tasks.length) {
            Promise.resolve().then(() => {
                let task; while (task = tasks.shift()) task();
            }).catch(console.error);
        }

        return source;
    }

    path = path ? path + '.' : '';

    if (source instanceof Array) {
        for (let key = 0; key < source.length; key++) {
            tasks.push(handler.bind(null, source[key], path + key));
            source[key] = create(source[key], handler, path + key, tasks);
        }
    } else if (source instanceof Object) {
        for (let key in source) {
            tasks.push(handler.bind(null, source[key], path + key));
            source[key] = create(source[key], handler, path + key, tasks);
        }
    }

    if (!path && tasks.length) {
        Promise.resolve().then(() => {
            let task; while (task = tasks.shift()) task();
        }).catch(console.error);
    }

    return new Proxy(source, {
        get: get.bind(get, tasks, handler, path),
        set: set.bind(set, tasks, handler, path)
    });

};

const clone = function (source, handler, path, tasks) {
    path = path || '';
    tasks = tasks || [];

    tasks.push(handler.bind(null, source, path));

    if (source instanceof Object === false && source instanceof Array === false) {

        if (!path && tasks.length) {
            Promise.resolve().then(() => {
                let task; while (task = tasks.shift()) task();
            }).catch(console.error);
        }

        return source;
    }
    
    let target;

    path = path ? path + '.' : '';

    if (source instanceof Array) {
        target = [];
        for (let key = 0; key < source.length; key++) {
            tasks.push(handler.bind(null, source[key], path + key));
            target[key] = create(source[key], handler, path + key, tasks);
        }
    } else if (source instanceof Object) {
        target = {};
        for (let key in source) {
            tasks.push(handler.bind(null, source[key], path + key));
            target[key] = create(source[key], handler, path + key, tasks);
        }
    }

    if (!path && tasks.length) {
        Promise.resolve().then(() => {
            let task; while (task = tasks.shift()) task();
        }).catch(console.error);
    }

    return new Proxy(target, {
        get: get.bind(get, tasks, handler, path),
        set: set.bind(set, tasks, handler, path)
    });

};

export default { get, set, create, clone };
