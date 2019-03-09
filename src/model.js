import Observer from './observer.js';
import Binder from './binder.js';
import Piper from './piper.js';
// import Methods from './methods.js';
// import View from './view.js';

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

	listener (data, path, type) {

		const paths = path.split('.');
		const part = paths.slice(1).join('.');
		const scope = paths.slice(0, 1).join('.');

		if (scope in Binder.data === false) return;// console.warn(`Oxe.model.listener - scope not found: ${scope}`);
		if (part in Binder.data[scope] === false) return;// console.warn(`Oxe.model.listener - path not found: ${part}`);
		if (0 in Binder.data[scope][part] === false) return;// console.warn('Oxe.model.listener - data not found');

		const binders = Binder.data[scope][part];

		for (let i = 0, l = binders.length; i < l; i++) {
			data = Piper(binders[i], data);
			Binder.render(binders[i], data);
		}

		// if (typeof data === 'object') {
		if (type !== 'length' && typeof data === 'object') {
			const binderPaths = Binder.data[scope];
			for (let binderPath in binderPaths) {
				if (part === '' || binderPath.indexOf(part + '.') === 0) {
					const binders = binderPaths[binderPath];
					for (let i = 0, l = binders.length; i < l; i++) {
						const d = Piper(binders[i], this.get(scope+'.'+binderPath));
						Binder.render(binders[i], d);
					}
				}
			}
		}

	}

};
