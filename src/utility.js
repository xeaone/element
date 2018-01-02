
var Utility = {};

Utility.PATH = /\s*\|.*/;
Utility.PREFIX = /(data-)?o-/;
Utility.ROOT = /^(https?:)?\/?\//;
Utility.TYPE = /(data-)?o-|-.*$/g;
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

Utility.binderName = function (data) {
	return data.replace(this.PREFIX, '');
};

Utility.binderType = function (data) {
	return data.replace(this.TYPE, '');
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

Utility.formData = function (form, model, callback) {
	var elements = form.querySelectorAll('[o-value]');
	var data = {};

	var done = 0;
	var count = 0;

	for (var i = 0, l = elements.length; i < l; i++) {

		var element = elements[i];
		var path = element.getAttribute('o-value');

		if (!path) continue;

		path = path.replace(/\s*\|.*/, '');
		var name = path.split('.').slice(-1);

		data[name] = Utility.getByPath(model, path);

		if (!data[name] || data[name].constructor !== FileList) continue

		var files = data[name];
		data[name] = [];

		for (var c = 0, t = files.length; c < t; c++) {
			var file = files[c];
			var reader = new FileReader();

			count++;

			reader.onload = function(d, n, f, e) {

				d[n].push({
					type: f.type,
					size: f.size,
					name: f.name,
					data: e.target.result,
					lastModified: f.lastModified
				});

				done++;

				if (i === l && count === done) {
					callback(d);
				}

			}.bind(null, data, name, file);

			reader.readAsText(file);
		}

	}

	if (i === l && count === done) {
		callback(data);
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

Utility.joinDot = function () {
	return Array.prototype.join
		.call(arguments, '.')
		.replace(/\.{2,}/g, '.');
};

Utility.getContainer = function getContainer (element) {

	if (element.hasAttribute('o-uid') || element.hasAttribute('data-o-uid')) {
		return element;
	}

	if (element.parentElement) {
		return this.getContainer(element.parentElement);
	}

	console.warn('Oxe.utility - could not find container uid');
	console.warn(element);
};

Utility.extension = function (data) {
	var position = data.lastIndexOf('.');
	return position > 0 ? data.slice(position + 1) : '';
};

Utility.join = function () {
	return Array.prototype.join
		.call(arguments, '/')
		.replace(/\/{2,}/g, '/')
		.replace(/^(https?:\/)/, '$1/');
};

Utility.base = function () {
	if (window.document.head.querySelector('base')) {
		return window.document.head.querySelector('base').href;
	} else {
		return window.location.origin + '/';
	}
};

Utility.resolve = function () {
	var result = [], root = '/';
	var path = Array.prototype.join.call(arguments, '/');

	if (!this.ROOT.test(path)) {
		path = this.base() + path;
	}

	path = path.replace(window.location.origin, '');
	path = path.replace(/^\//, '');
	path = path.replace(/\/$/, '');

	var paths = path.split('/');

	for (var i = 0, l = paths.length; i < l; i++) {
		if (paths[i] === '.' || paths[i] === '') {
			continue;
		} else if (paths[i] === '..') {
			if (i > 0) {
				result.slice(i - 1, 1);
			}
		} else {
			result.push(paths[i]);
		}
	}

	return root + result.join('/');
}

export default Utility;
