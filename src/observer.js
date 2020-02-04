const methods = [ 'push','pop','splice','shift','unshift','reverse' ];

export default {

    get (tasks, handler, path, target, property) {

        if (target instanceof Array && methods.indexOf(property) !== -1) {
            // console.log(path.slice(0, -1));
            tasks.push(handler.bind(null, target, path.slice(0, -1)));
        }

        return target[property];
    },

    set (tasks, handler, path, target, property, value) {

        // if (property === 'length') {
        //     console.log('length ', value);
        //     return true;
        // }
        // console.log(property);

        target[property] = this.create(value, handler, path + property, tasks);

        if (tasks.length) {
            Promise.resolve().then(function () {
                let task; while (task = tasks.shift()) task();
            }).catch(console.error);
        }

        return true;
    },

    create (source, handler, path, tasks) {
        path = path || '';
        tasks = tasks || [];

        tasks.push(handler.bind(null, source, path));

        if (source instanceof Object === false && source instanceof Array === false) {

            if (!path && tasks.length) {
                Promise.resolve().then(function () {
                    let task; while (task = tasks.shift()) task();
                }).catch(console.error);
            }

            return source;
        }

        path = path ? path + '.' : '';

        if (source instanceof Array) {
            for (let key = 0; key < source.length; key++) {
                tasks.push(handler.bind(null, source[key], path + key));
                source[key] = this.create(source[key], handler, path + key, tasks);
            }
        }

        if (source instanceof Object) {
            for (let key in source) {
                tasks.push(handler.bind(null, source[key], path + key));
                source[key] = this.create(source[key], handler, path + key, tasks);
            }
        }

        if (!path && tasks.length) {
            Promise.resolve().then(function () {
                let task; while (task = tasks.shift()) task();
            }).catch(console.error);
        }

        return new Proxy(source, {
            get: this.get.bind(this, tasks, handler, path),
            set: this.set.bind(this, tasks, handler, path)
        });

    }

};
