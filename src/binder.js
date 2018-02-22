import Unrender from './lib/unrender';
import Render from './lib/render';
import Global from './global';

export default class Binder {

	constructor () {
		this.data = {};
	}

	modifyData (opt, data) {

		if (!opt.modifiers.length) {
			return data;
		}

		if (!Global.methods.data[opt.scope]) {
			return data;
		}

		for (var i = 0, l = opt.modifiers.length; i < l; i++) {
			var modifier = opt.modifiers[i];
			var scope = Global.methods.data[opt.scope];

			if (scope) {
				data = scope[modifier].call(opt.container, data);
			}

		}

		return data;
	}

	add (opt) {

		if (!(opt.scope in this.data)) {
			this.data[opt.scope] = {};
		}

		if (!(opt.path in this.data[opt.scope])) {
			this.data[opt.scope][opt.path] = [];
		}

		this.data[opt.scope][opt.path].push(opt);
	}

	remove (opt) {

		if (!(opt.scope in this.data)) {
			return;
		}

		if (!(opt.path in this.data[opt.scope])) {
			return;
		}

		var data = this.data[opt.scope][opt.path];

		for (var i = 0, l = data.length; i < l; i++) {
			var item = data[i];

			if (item.element === opt.element) {
				return data.splice(i, 1);
			}

		}

	}

	get (opt) {

		if (!(opt.scope in this.data)) {
			return null;
		}

		if (!(opt.path in this.data[opt.scope])) {
			return null;
		}

		var data = this.data[opt.scope][opt.path];

		for (var i = 0; i < data.length; i++) {
			var item = data[i];

			if (item.element === opt.element) {
				if (item.name === opt.name) {
					return item;
				}
			}

		}

		return null;
	}

	each (scope, path, callback) {
		var i, key, binder, binders;
		var paths = this.data[scope];

		if (!path) {

			for (key in paths) {
				binders = paths[key];
				for (i = 0; i < binders.length; i++) {
					binder = binders[i];
					callback(binder, i, binders, paths, key);
				}
			}

		} else {

			for (key in paths) {
				if (key.indexOf(path) === 0) {
					if (key === path || key.slice(path.length).charAt(0) === '.') {
						binders = paths[key];

						for (i = 0; i < binders.length; i++) {
							binder = binders[i];
							callback(binder, i, binders, paths, key);
						}

					}
				}
			}

		}

	}

	create (opt) {
		opt = opt || {};

		if (!opt.name) {
			throw new Error('render a name');
		}

		if (!opt.element) {
			throw new Error('render a element');
		}

		opt.container = opt.container || Global.utility.getScope(opt.element);
		opt.scope = opt.scope || opt.container.getAttribute('o-scope');
		opt.value = opt.value || opt.element.getAttribute(opt.name);
		opt.path = opt.path || Global.utility.binderPath(opt.value);

		opt.type = opt.type || Global.utility.binderType(opt.name);
		opt.names = opt.names || Global.utility.binderNames(opt.name);
		opt.values = opt.values || Global.utility.binderValues(opt.value);
		opt.modifiers = opt.modifiers || Global.utility.binderModifiers(opt.value);

		opt.keys = opt.keys || [opt.scope].concat(opt.values);
		opt.model = opt.model || Global.model.data[opt.scope];

		return opt;
	}

	unrender (opt, caller) {

		opt = this.get(opt);

		if (!opt) {
			return;
		}

		if (opt.type in Unrender) {
			Unrender[opt.type](opt, caller);
		} else {
			Unrender.default(opt);
		}

		this.remove(opt);

	}

	render (opt, caller) {

		opt = this.create(opt);
		opt = this.get(opt) || opt;

		opt.data = Global.model.get(opt.keys);

		if (!opt.exists) {
			opt.exists = true;
			this.add(opt);
		}

		if (!opt.pending) {

			opt.pending = true;

			if (opt.type in Render) {
				Render[opt.type](opt, caller);
			} else {
				Render.default(opt);
			}

		}

	}

}
