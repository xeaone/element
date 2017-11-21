import Unrender from './unrender';
import Global from '../global';
import Render from './render';
import Setup from './setup';

var Binder = {};

Binder.data = {};

Binder.setupMethod = Setup;
Binder.renderMethod = Render;
Binder.unrenderMethod = Unrender;

Binder.ensureData = function (opt) {
	return Global.model.ensure(opt.keys);
};

Binder.setData = function (opt, data) {
	return Global.model.set(opt.keys, data);
};

Binder.getData = function (opt) {

	if (opt.type === 'on') {
		return Global.utility.getByPath(Global.events.data, opt.uid + '.' + opt.path);
	} else {
		return Global.model.get(opt.keys);
	}

};

Binder.modifyData = function (opt, data) {

	if (!opt.modifiers.length) {
		return data;
	}

	for (var i = 0, l = opt.modifiers.length; i < l; i++) {
		var modifier = opt.modifiers[i];
		data = Global.modifiers.data[opt.uid][modifier].call(opt.model, data);
	}

	return data;
};

Binder.add = function (opt) {

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

Binder.remove = function (opt) {

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

Binder.get = function (opt) {

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

Binder.each = function (uid, path, callback) {
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

Binder.option = function (opt) {
	opt = opt || {};

	if (!opt.name) {
		throw new Error('Binder.render - requires a name');
	}

	if (!opt.element) {
		throw new Error('Binder.render - requires a element');
	}

	opt.container = opt.container || Global.utility.getContainer(opt.element);
	opt.uid = opt.uid || opt.container.getAttribute('o-uid');
	opt.value = opt.value || opt.element.getAttribute(opt.name);
	opt.path = opt.path || Global.utility.binderPath(opt.value);

	var tmp = this.get(opt);

	if (tmp) {
		return tmp;
	}

	opt.exists = false;
	opt.type = opt.type || Global.utility.binderType(opt.name);
	opt.names = opt.names || Global.utility.binderNames(opt.name);
	opt.values = opt.values || Global.utility.binderValues(opt.value);
	opt.modifiers = opt.modifiers || Global.utility.binderModifiers(opt.value);

	opt.keys = opt.keys || [opt.uid].concat(opt.values);
	opt.model = opt.model || Global.model.data[opt.uid];
	opt.modifiers = opt.modifiers || Global.modifiers.data[opt.uid];

	this.ensureData(opt);

	if (opt.type in this.setupMethod) {
		this.setupMethod[opt.type].call(this, opt);
	}

	return opt;
};

Binder.batch = function (callback) {
	Global.batcher.write(callback.bind(this));
}

Binder.unrender = function (opt, caller) {
	opt = this.option(opt);

	if (opt.type in this.unrenderMethod) {
		this.batch(function () {

			this.unrenderMethod[opt.type].call(this, opt, caller);
			this.remove(opt);

		});
	}
};

Binder.render = function (opt, caller) {
	opt = this.option(opt);

	if (opt.type in this.renderMethod) {
		this.batch(function () {

			this.renderMethod[opt.type].call(this, opt, caller);
			this.add(opt);

		});
	}
};

export default Binder;
