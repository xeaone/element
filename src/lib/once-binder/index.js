
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

OnceBinder.ensureData = function (opt) {
	return Global.model.ensure(opt.keys);
};

OnceBinder.setData = function (opt, data) {
	if (data !== undefined) {
		return Global.model.set(opt.keys, data);
	}
};

OnceBinder.getData = function (opt) {
	if (opt.type === 'on') {
		return Utility.getByPath(Global.events.data, opt.uid + '.' + opt.path);
	} else {
		return Global.model.get(opt.keys);
	}
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
	opt = opt || {};

	if (!opt.type) throw new Error('OnceBinder.render - requires a type');
	if (!opt.element) throw new Error('OnceBinder.render - requires a element');

	var tmp = this.get(opt);
	if (tmp) return tmp;

	opt.exists = false;

	opt.container = opt.container || Utility.getContainer(opt.element);
	opt.uid = opt.uid || opt.container.getAttribute('o-uid');

	opt.attribute = opt.attribute || {};
	opt.attribute.value = opt.value || opt.attribute.value || opt.element.getAttribute(opt.attribute.name);

	opt.path = opt.path || opt.attribute.path || Utility.binderPath(opt.attribute.value);
	opt.names = opt.names || opt.attribute.names || Utility.binderNames(opt.attribute.name);
	opt.values = opt.values || opt.attribute.values || Utility.binderValues(opt.attribute.value);
	opt.modifiers = opt.modifiers || opt.attribute.modifiers || Utility.binderModifiers(opt.attribute.value);

	opt.keys = [opt.uid].concat(opt.values);
	opt.model = opt.model || Global.model.data[opt.uid];
	opt.modifiers = opt.modifiers || Global.modifiers.data[opt.uid];

	this.ensureData(opt);

	return opt;
};

OnceBinder.unrender = function (opt) {
	opt.type = opt.type || opt.attribute.type;
	if (opt.method = this.unrenderMethod[opt.type]) {
		Global.batcher.write(function (opt, data) {

			opt = this.option(opt);
			data = this.getData(opt);
			data = opt.method.call(this, opt, data);

			if (data !== undefined) {
				this.setData(opt, data);
			}

			if (opt.exists === true) {
				this.remove(opt);
			}

		}.bind(this, opt));
	}
};

OnceBinder.render = function (opt) {
	opt.type = opt.type || opt.attribute.type;
	if (opt.method = this.renderMethod[opt.type]) {
		Global.batcher.write(function (opt, data) {

			opt = this.option(opt);
			data = this.getData(opt);
			data = opt.method.call(this, opt, data);

			if (data !== undefined) {
				this.setData(opt, data);
			}

			if (opt.exists === false) {
				this.add(opt);
			}

		}.bind(this, opt));
	}
};

export default OnceBinder;
