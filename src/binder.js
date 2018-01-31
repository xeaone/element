import Unrender from './lib/unrender';
import Render from './lib/render';
import Global from './global';

var Binder = function () {
	this.data = {};
};

Binder.prototype.modifyData = function (opt, data) {

	if (!opt.modifiers.length) {
		return data;
	}

	for (var i = 0, l = opt.modifiers.length; i < l; i++) {
		var modifier = opt.modifiers[i];
		data = Global.methods.data[opt.scope][modifier].call(opt.element, data);
	}

	return data;
};

Binder.prototype.add = function (opt) {

	if (!(opt.scope in this.data)) {
		this.data[opt.scope] = {};
	}

	if (!(opt.path in this.data[opt.scope])) {
		this.data[opt.scope][opt.path] = [];
	}

	this.data[opt.scope][opt.path].push(opt);
};

Binder.prototype.remove = function (opt) {

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

};

Binder.prototype.get = function (opt) {

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
};

Binder.prototype.each = function (scope, path, callback) {
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
};

Binder.prototype.create = function (opt) {
	opt = opt || {};

	if (!opt.name) {
		throw new Error('Binder.prototype.render - requires a name');
	}

	if (!opt.element) {
		throw new Error('Binder.prototype.render - requires a element');
	}

	opt.container = opt.container || Global.utility.getContainer(opt.element);
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
};

Binder.prototype.unrender = function (opt, caller) {

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

};

Binder.prototype.render = function (opt, caller) {

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

};

export default Binder;
