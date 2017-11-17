
import UnrenderValue from '../unrender/value';
import UnrenderOn from '../unrender/on';

import RenderValue from '../render/value';
import RenderOn from '../render/on';

import Global from '../../global';
import Utility from '../utility';

var OnceBinder = {};

OnceBinder.data = {};

OnceBinder.unrenderMethod = {
	on: UnrenderOn,
	value: UnrenderValue
};

OnceBinder.renderMethod = {
	on: RenderOn,
	value: RenderValue
};

OnceBinder.ensureData = function (keys) {
	return Global.model.ensure(keys);
};

OnceBinder.setData = function (keys, data) {
	return Global.model.set(keys, data);
};

OnceBinder.getData = function (keys) {
	return Global.model.get(keys);
};

OnceBinder.add = function (opt) {
	opt.exists = true;

	if (!(opt.uid in this.data)) {
		this.data[opt.uid] = {};
	}

	if (!(opt.path in this.data[opt.uid])) {
		this.data[opt.uid][opt.path] = [];
	}

	this.data[opt.uid][opt.path].push(opt);
};

OnceBinder.remove = function (opt) {
	var data;

	if (!(opt.uid in this.data)) {
		return;
	}

	if (!(opt.path in this.data[opt.uid])) {
		return;
	}

	data = this.data[opt.uid][opt.path];

	for (var i = 0, l = data.length; i < l; i++) {
		var item = data[i];
		if (item.element === opt.element) {
			return data.splice(i, 1);
		}
	}
};

OnceBinder.get = function (opt) {
	var data;

	if (!(opt.uid in this.data)) {
		return;
	}

	if (!(opt.path in this.data[opt.uid])) {
		return;
	}

	data = this.data[opt.uid][opt.path];

	for (var i = 0, l = data.length; i < l; i++) {
		var item = data[i];
		if (item.element === opt.element) {
			return item;
		}
	}
};

OnceBinder.update = function (opt) {
	var data;

	if (!(opt.uid in this.data)) {
		return;
	}

	if (!(opt.path in this.data[opt.uid])) {
		return;
	}

	data = this.data[opt.uid][opt.path];

	for (var i = 0, l = data.length; i < l; i++) {
		var item = data[i];
		if (item.element === opt.element) {
			for (var key in opt) {
				item[key] = opt[key];
			}
			return item;
		}
	}
};

// OnceBinder.modifyData = function (opt, data) {
// 	if (opt.modifiers && opt.attribute.modifiers.length) {
// 		for (var i = 0, l = opt.attribute.modifiers.length; i < l; i++) {
// 			data = opt.modifiers[opt.attribute.modifiers[i]].call(opt.model, data);
// 		}
// 	}
// 	return data;
// };

OnceBinder.option = function (opt) {
	var tmp = this.get(opt);
	if (tmp) return tmp;

	opt.exists = false;

	// if (!opt.element) throw new Error('OnceBinder.render - requires a element');

	opt.container = opt.container || Utility.getContainer(opt.element);
	opt.uid = opt.uid || opt.container.getAttribute('o-uid');

	opt.attribute = opt.attribute || {};
	opt.attribute.name = opt.name || opt.attribute.name || 'o-' + opt.type; // FIXME
	opt.attribute.value = opt.value || opt.attribute.value || opt.element.getAttribute(opt.attribute.name);

	opt.path = opt.path || opt.attribute.path || Utility.binderPath(opt.attribute.value);
	opt.names = opt.names || opt.attribute.names || Utility.binderNames(opt.attribute.name);
	opt.values = opt.values || opt.attribute.values || Utility.binderValues(opt.attribute.value);
	opt.modifiers = opt.modifiers || opt.attribute.modifiers || Utility.binderModifiers(opt.attribute.value);

	opt.keys = [opt.uid].concat(opt.values);
	opt.type = opt.type || opt.attribute.type || opt.names[0]; // FIXME
	opt.model = opt.model || Global.model.get([opt.uid]);
	// opt.modifiers = opt.modifiers || Global.modifiers.data[opt.uid];

	if (opt.type === 'on') {
		opt.data = Utility.getByPath(Global.events.data, opt.uid + '.' + opt.path);
	} else {
		opt.data = Global.model.get(opt.keys);
	}

	return opt;
};

OnceBinder.unrender = function (opt) {
	opt.type = opt.type || opt.attribute.type;
	if (opt.method = this.unrenderMethod[opt.type]) {
		opt = this.option(opt);
		Global.batcher.write(opt.method.bind(this, opt));
		if (opt.exists === true) {
			this.remove(opt);
		}
	}
};

OnceBinder.render = function (opt) {
	opt.type = opt.type || opt.attribute.type;
	if (opt.method = this.renderMethod[opt.type]) {
		opt = this.option(opt);
		Global.batcher.write(opt.method.bind(this, opt));
		if (opt.exists === false) {
			this.add(opt);
		}
	}
};

export default OnceBinder;
