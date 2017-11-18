import UnrenderValue from './unrender/value.js';

var Utility = {};

Utility.PATH = /\s*\|.*/;
Utility.PREFIX = /(data-)?o-/;
Utility.SPLIT_MODIFIERS = /\s|\s?,\s?/;

Utility.binderNormalize = function (data) {
	return !data ? '' : data
		.replace(/\s+$/, '')
		.replace(/^\s+/, '')
		.replace(/\.{2,}/g, '.')
		.replace(/\|{2,}/g, '|')
		.replace(/\,{2,}/g, ',')
		.replace(/\s{2,}/g, ' ')
		.replace(/\s?\|\s?/, '|');
};

Utility.binderNames = function (data) {
	return data.replace(this.PREFIX, '').split('-');
};

Utility.binderValues = function (data) {
	data = Utility.binderNormalize(data);
	var index = data.indexOf('|');
	return index === -1 ? data.split('.') : data.slice(0, index).split('.');
};

Utility.binderModifiers = function (data) {
	data = Utility.binderNormalize(data);
	var index = data.indexOf('|');
	return index === -1 ? [] : data.slice(index + 1).split(Utility.SPLIT_MODIFIERS);
};

Utility.binderPath = function (data) {
	return Utility.binderNormalize(data).replace(Utility.PATH, '');
};

Utility.createBase = function (base) {
	var element = document.head.querySelector('base');

	if (!element) {
		element = document.createElement('base');
		document.head.insertBefore(element, document.head.firstChild);
	}

	if (typeof base === 'string') {
		element.href = base;
	}

	base = element.href;

	return base;
};

Utility.formData = function (form, model) {
	var elements = form.querySelectorAll('[o-value]');
	var data = {};

	for (var i = 0, l = elements.length; i < l; i++) {
		var element = elements[i];
		var path = element.getAttribute('o-value');
		if (path) {
			path = path.replace(/\s*\|.*/, '');
			var name = path.split('.').slice(-1);
			data[name] = Utility.getByPath(model, path);
		}
	}

	return data;
};

Utility.formReset = function (form, model) {
	var elements = form.querySelectorAll('[o-value]');
	for (var i = 0, l = elements.length; i < l; i++) {
		UnrenderValue({
			type: 'o-value',
			element: elements[i]
		});
	}
};

Utility.toText = function (data) {
	if (typeof data === 'object') {
		 return JSON.stringify(data);
	} else {
		return String(data);
	}
};

Utility.traverse = function (data, path, callback) {
	var keys = typeof path === 'string' ? path.split('.') : path;
	var last = keys.length - 1;

	for (var i = 0; i < last; i++) {
		var key = keys[i];

		if (!(key in data)) {
			if (typeof callback === 'function') {
				callback(data, key, i, keys);
			} else {
				return undefined;
			}
		}

		data = data[key];
	}

	return {
		data: data,
		key: keys[last]
	}
};

Utility.setByPath = function (data, path, value) {
	var keys = typeof path === 'string' ? path.split('.') : path;
	var last = keys.length - 1;

	for (var i = 0; i < last; i++) {
		var key = keys[i];
		if (!(key in data)) {
			if (isNaN(keys[i+1])) {
				data[key] = {};
			} else {
				data[key] = [];
			}
		}
		data = data[key];
	}

	return data[keys[last]] = value;
};

Utility.getByPath = function (data, path) {
	var keys = typeof path === 'string' ? path.split('.') : path;
	var last = keys.length - 1;

	for (var i = 0; i < last; i++) {
		var key = keys[i];
		if (!(key in data)) {
			return undefined;
		} else {
			data = data[key];
		}
	}

	return data[keys[last]];
};

Utility.removeChildren = function (element) {
	var child;
	while (child = element.lastElementChild) {
		element.removeChild(child);
	}
};

Utility.joinSlash = function () {
	return Array.prototype.join
		.call(arguments, '/')
		.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
};

Utility.joinDot = function () {
	return Array.prototype.join
		.call(arguments, '.')
		.replace(/\.{2,}/g, '.');
};

Utility.getContainer = function getContainer (element) {
	if (element.hasAttribute('o-uid') || element.hasAttribute('data-o-uid')) return element;
	if (element.parentElement) return this.getContainer(element.parentElement);
	console.log(element);
	console.warn('Utility could not find a uid');
};

export default Utility;
