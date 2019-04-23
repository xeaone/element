import Observer from './observer.js';
import Binder from './binder.js';

export default {

    GET: 2,
    SET: 3,
    REMOVE: 4,
    data: null,
    tasks: [],
    target: {},

    async setup (options) {
        options = options || {};
        this.target = options.target || this.target;
        this.data = Observer.create(this.target, this.listener.bind(this));
    },

    traverse (type, keys, value) {
        let result;

        if (typeof keys === 'string') {
            keys = keys.split('.');
        }

        let data = this.data;
        let key = keys[keys.length-1];

        for (let i = 0, l = keys.length-1; i < l; i++) {

            if (!(keys[i] in data)) {

                if (type === this.GET || type === this.REMOVE) {
                    return undefined;
                } else if (type === this.SET) {
                    data.$set(keys[i], isNaN(keys[i+1]) ? {} : []);
                }

            }

            data = data[keys[i]];
        }

        if (type === this.SET) {
            result = data.$set(key, value);
        } else if (type === this.GET) {
            result = data[key];
        } else if (type === this.REMOVE) {
            result = data[key];
            data.$remove(key);
        }

        return result;
    },

    get (keys) {
        return this.traverse(this.GET, keys);
    },

    remove (keys) {
        return this.traverse(this.REMOVE, keys);
    },

    set (keys, value) {
        return this.traverse(this.SET, keys, value);
    },

    listener (data, location, type) {
        const parts = location.split('.');
        const part = parts.slice(1).join('.');
        const scope = parts.slice(0, 1).join('.');

        const paths = Binder.get('location', scope);

        if (!paths) return;

        paths.forEach(function (binders, path) {
            if (
                part === '' ||
				path === part ||
				(type !== 'length' && path.indexOf(part + '.') === 0)
            ) {
                binders.forEach(function (binder) {
                    Binder.render(binder);
                });
            }
        });

    }

};
