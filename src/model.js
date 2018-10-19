import Observer from './observer.js';
import Unrender from './unrender.js';
import Binder from './binder.js';
import Render from './render.js';

class Model {

	constructor () {
		this.GET = 2;
		this.SET = 3;
		this.REMOVE = 4;
		this.ran = false;
		this.data = Observer.create({}, this.listener.bind(this));
	}

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
					// if (keys[i]) throw new Error('key is undefined');
					// console.log(keys[i]);
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
	}

	get (keys) {
		return this.traverse(this.GET, keys);
	}

	remove (keys) {
		return this.traverse(this.REMOVE, keys);
	}

	set (keys, value) {
		return this.traverse(this.SET, keys, value);
	}

	listener (data, path) {
		const method = data === undefined ? Unrender : Render;

		Binder.each(path, function (binder) {

			method.default(binder);

		});

	}

}

export default new Model();
