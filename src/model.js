import Observer from './observer.js';
import Unrender from './unrender.js';
import Binder from './binder.js';
import Render from './render.js';

const listener = function (data, path, type) {
	let method = data === undefined ? Unrender : Render;

	if (type === 'length') {
		let scope = path.split('.').slice(0, 1).join('.');
		let part = path.split('.').slice(1).join('.');

		if (!(scope in Binder.data)) return;
		if (!(part in Binder.data[scope])) return;
		if (!(0 in Binder.data[scope][part])) return;

		let binder = Binder.data[scope][part][0];

		method.default(binder);
	} else {
		Binder.each(path, function (binder) {
			method.default(binder);
		});
	}

};

export default {

	GET: 2,
	SET: 3,
	REMOVE: 4,
	ran: false,
	data: Observer.create({}, listener),

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
	}

};
