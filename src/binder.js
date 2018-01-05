import Unrender from './lib/unrender';
import Render from './lib/render';
import Setup from './lib/setup';
import Global from './global';

var Binder = function () {
	this.data = {};
	this.setupMethod = Setup;
	this.renderMethod = Render;
	this.unrenderMethod = Unrender;
};

Binder.prototype.ensureData = function (opt) {
	return Global.model.ensure(opt.keys);
};

Binder.prototype.setData = function (opt, data) {
	return Global.model.set(opt.keys, data);
};

Binder.prototype.getData = function (opt) {

	if (opt.type === 'on') {
		return Global.utility.getByPath(Global.events.data, opt.uid + '.' + opt.path);
	} else {
		return Global.model.get(opt.keys);
	}

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

	if (opt.exists) {
		return;
	} else {
		opt.exists = true;
	}

	if (opt.type === 'value') {
		return;
	}

	if (!(opt.uid in this.data)) {
		this.data[opt.uid] = {};
	}

	if (!(opt.path in this.data[opt.uid])) {
		this.data[opt.uid][opt.path] = [];
	}

	this.data[opt.uid][opt.path].push(opt);
};

Binder.prototype.remove = function (opt) {

	if (!opt.exists) {
		return;
	}

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
		return;
	}

	if (!(opt.path in this.data[opt.uid])) {
		return;
	}

	var data = this.data[opt.uid][opt.path];

	for (var i = 0, l = data.length; i < l; i++) {
		var item = data[i];

		if (item.element === opt.element) {
			return item;
		}

	}

};

Binder.prototype.each = function (uid, path, callback) {
	var paths = this.data[uid];

	for (var key in paths) {

		if (key.indexOf(path) === 0) {
			var binders = paths[key];

			for (var i = 0, l = binders.length; i < l; i++) {
				var binder = binders[i];

				callback(binder, i, binders, paths, key);
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

	opt.setup = false;
	opt.exists = false;
	opt.pending = false;

	return opt;
};

Binder.prototype.unrender = function (opt, caller) {
	var self = this;

	opt = self.get(opt);

	if (!opt) {
		return;
	}

	if (opt.type in self.unrenderMethod) {
		self.unrenderMethod[opt.type](opt, caller);
	}

	self.remove(opt);

};

Binder.prototype.render = function (opt, caller) {
	var self = this;

	opt = self.get(opt) || self.create(opt);

	if (!opt.exists) {
		self.add(opt);
		opt.exists = true;
	}

	var done = function () {
		if (opt.type in self.renderMethod) {
			self.renderMethod[opt.type](opt, caller);
		}
	};

	if (opt.type in self.setupMethod && !opt.setup) {
		opt.setup = true;
		self.ensureData(opt);
		// self.setupMethod[opt.type](opt);
		self.setupMethod[opt.type](opt, done);
	}
	else {
		done();
	}

	// if (opt.type in self.renderMethod) {
	// 	self.renderMethod[opt.type](opt, caller);
	// }

};

export default Binder;
