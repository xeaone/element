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
		data = Global.modifiers.data[opt.uid][modifier].call(opt.model, data);
	}

	return data;
};

Binder.prototype.add = function (opt) {

	if (!(opt.uid in this.data)) {
		this.data[opt.uid] = {};
	}

	if (!(opt.path in this.data[opt.uid])) {
		this.data[opt.uid][opt.path] = [];
	}

	this.data[opt.uid][opt.path].push(opt);
};

Binder.prototype.remove = function (opt) {

	if (!(opt.uid in this.data)) {
		return;
	}

	if (!(opt.path in this.data[opt.uid])) {
		return;
	}

	var data = this.data[opt.uid][opt.path];

	for (var i = 0, l = data.length; i < l; i++) {
		var item = data[i];

		if (item.element === opt.element) {
			return data.splice(i, 1);
		}

	}

};

Binder.prototype.get = function (opt) {

	if (!(opt.uid in this.data)) {
		return null;
	}

	if (!(opt.path in this.data[opt.uid])) {
		return null;
	}

	var data = this.data[opt.uid][opt.path];

	for (var i = 0; i < data.length; i++) {
		var item = data[i];

		if (item.element === opt.element) {
			item.data = Global.model.get(item.keys);
			return item;
		}

	}

	return null;
};

Binder.prototype.each = function (uid, path, callback) {
	var paths = this.data[uid];


	for (var key in paths) {

		if (key.indexOf(path) === 0) {

			if (key === path || key.slice(path.length).charAt(0) === '.') {

				var binders = paths[key];

				for (var i = 0, l = binders.length; i < l; i++) {
					var binder = binders[i];

					callback(binder, i, binders, paths, key);
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
	opt.uid = opt.uid || opt.container.getAttribute('o-uid');
	opt.value = opt.value || opt.element.getAttribute(opt.name);
	opt.path = opt.path || Global.utility.binderPath(opt.value);

	opt.type = opt.type || Global.utility.binderType(opt.name);
	opt.names = opt.names || Global.utility.binderNames(opt.name);
	opt.values = opt.values || Global.utility.binderValues(opt.value);
	opt.modifiers = opt.modifiers || Global.utility.binderModifiers(opt.value);

	opt.keys = opt.keys || [opt.uid].concat(opt.values);
	opt.model = opt.model || Global.model.data[opt.uid];
	opt.modifiers = opt.modifiers || Global.modifiers.data[opt.uid];

	opt.data = Global.model.get(opt.keys);

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

	// if (opt.data === undefined) {
	// 	opt.data = Global.model.set(opt.keys, undefined);
	// }

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
