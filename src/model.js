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
		var result;

		if (typeof keys === 'string') {
			keys = keys.split('.');
		}

		var data = this.data;
		var key = keys[keys.length-1];

		for (var i = 0, l = keys.length-1; i < l; i++) {

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

	listener (data, path, type) {
		var method = data === undefined ? Unrender : Render;

		if (type === 'length') {
			var scope = path.split('.').slice(0, 1).join('.');
			var part = path.split('.').slice(1).join('.');

			if (!(scope in Binder.data)) return;
			if (!(part in Binder.data[scope])) return;
			if (!(0 in Binder.data[scope][part])) return;

			var binder = Binder.data[scope][part][0];

			method.default(binder);
		} else {
			Binder.each(path, function (binder) {
				method.default(binder);
			});
		}

	}

}

export default new Model();
