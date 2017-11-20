import Global from '../../global';
import Utility from '../utility';

import UnrenderValue from '../unrender/value';
import UnrenderText from '../unrender/text';
import UnrenderEach from '../unrender/each';
import UnrenderOn from '../unrender/on';

import RenderValue from '../render/value';
import RenderEach from '../render/each';
import RenderText from '../render/text';
import RenderOn from '../render/on';

var OnceBinder = {};

OnceBinder.data = {};

OnceBinder.unrenderMethod = {
	on: UnrenderOn,
	each: UnrenderEach,
	text: UnrenderText,
	value: UnrenderValue
};

OnceBinder.renderMethod = {
	on: RenderOn,
	each: RenderEach,
	text: RenderText,
	value: RenderValue
};

OnceBinder.ensureData = function (opt) {
	return Global.model.ensure(opt.keys);
};

OnceBinder.setData = function (opt, data) {
	return Global.model.set(opt.keys, data);
};

OnceBinder.getData = function (opt) {
	if (opt.type === 'on') {
		return Utility.getByPath(Global.events.data, opt.uid + '.' + opt.path);
	} else {
		return Global.model.get(opt.keys);
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

OnceBinder.add = function (opt) {

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

OnceBinder.option = function (opt) {
	opt = opt || {};

	if (!opt.name) throw new Error('OnceBinder.render - requires a name');
	if (!opt.element) throw new Error('OnceBinder.render - requires a element');

	opt.container = opt.container || Utility.getContainer(opt.element);
	opt.uid = opt.uid || opt.container.getAttribute('o-uid');
	opt.value = opt.value || opt.element.getAttribute(opt.name);
	opt.path = opt.path || Utility.binderPath(opt.value);

	var tmp = this.get(opt);

	if (tmp) {
		console.log('is');
		return tmp;
	}

	opt.exists = false;
	opt.type = opt.type || Utility.binderType(opt.name);
	opt.names = opt.names || Utility.binderNames(opt.name);
	opt.values = opt.values || Utility.binderValues(opt.value);
	opt.modifiers = opt.modifiers || Utility.binderModifiers(opt.value);

	opt.keys = opt.keys || [opt.uid].concat(opt.values);
	opt.model = opt.model || Global.model.data[opt.uid];
	opt.modifiers = opt.modifiers || Global.modifiers.data[opt.uid];

	this.ensureData(opt);

	return opt;
};

OnceBinder.unrender = function (opt) {
	opt = this.option(opt);

	if (this.unrenderMethod[opt.type]) {
		Global.batcher.write(function (opt, data) {

			data = this.getData(opt);
			data = this.unrenderMethod[opt.type].call(this, opt, data);

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
	opt = this.option(opt);

	if (this.renderMethod[opt.type]) {
		Global.batcher.write(function (opt, data) {

			opt = this.option(opt);
			data = this.getData(opt);
			data = this.renderMethod[opt.type].call(this, opt, data);

			if (data !== undefined) {
				this.setData(opt, data);
			}

			if (opt.exists === false) {
				opt.exists === true;
				this.add(opt);
			}

		}.bind(this, opt));
	}
};

export default OnceBinder;
