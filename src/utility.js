
export default {

	PATH: /\s*\|.*/,
	PREFIX: /(data-)?o-/,
	ROOT: /^(https?:)?\/?\//,
	TYPE: /(data-)?o-|-.*$/g,
	SPLIT_MODIFIERS: /\s|\s?,\s?/,

	binderNormalize (data) {
		return !data ? '' : data
			.replace(/\s+$/, '')
			.replace(/^\s+/, '')
			.replace(/\.{2,}/g, '.')
			.replace(/\|{2,}/g, '|')
			.replace(/\,{2,}/g, ',')
			.replace(/\s{2,}/g, ' ')
			.replace(/\s?\|\s?/, '|');
	},

	binderName (data) {
		return data.replace(this.PREFIX, '');
	},

	binderType (data) {
		return data.replace(this.TYPE, '');
	},

	binderNames (data) {
		return data.replace(this.PREFIX, '').split('-');
	},

	binderValues (data) {
		data = this.binderNormalize(data);
		var index = data.indexOf('|');
		return index === -1 ? data.split('.') : data.slice(0, index).split('.');
	},

	binderModifiers (data) {
		data = this.binderNormalize(data);
		var index = data.indexOf('|');
		return index === -1 ? [] : data.slice(index + 1).split(this.SPLIT_MODIFIERS);
	},

	binderPath (data) {
		return this.binderNormalize(data).replace(this.PATH, '');
	},

	formData (form, model) {
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

			data[name] = this.getByPath(model, path);
		}

		return data;
	},

	walker (node, callback) {
		callback(node);
		node = node.firstChild;
		while (node) {
		    this.walker(node, callback);
		    node = node.nextSibling;
		}
	},

	replaceEachVariable (element, variable, path, index) {
		var self = this;
		var iindex = '$index';
		var vindex = '$' + variable;
		var result = [];

		this.walker(element, function (node) {
			if (node.nodeType === 3) {
				if (node.nodeValue === vindex || node.nodeValue === iindex) {
					node.nodeValue = index;
				}
			} else if (node.nodeType === 1) {
				for (var i = 0, l = node.attributes.length; i < l; i++) {
					var attribute = node.attributes[i];
					var name = attribute.name;
					var value = attribute.value.split(' ')[0].split('|')[0];
					if (name.indexOf('o-') === 0 || name.indexOf('data-o-') === 0) {
						if (value === variable || value.indexOf(variable) === 0) {
							attribute.value = path + '.' + index + attribute.value.slice(variable.length);
						}
					}
				}
			}
		});

	},

	traverse (data, path, callback) {
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
	},

	setByPath (data, path, value) {
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
	},

	getByPath (data, path) {
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
	},

	joinDot () {
		return Array.prototype.join
			.call(arguments, '.')
			.replace(/\.{2,}/g, '.');
	},

	getScope (element) {

		if (!element) {
			return;
		}

		if (element.hasAttribute('o-scope') || element.hasAttribute('data-o-scope')) {
			return element;
		}

		if (element.parentNode) {
			return this.getScope(element.parentNode);
		}

		// console.warn('Oxe.utility - could not find container scope');
	},

	extension (data) {
		var position = data.lastIndexOf('.');
		return position > 0 ? data.slice(position + 1) : '';
	},

	join () {
		return Array.prototype.join
			.call(arguments, '/')
			.replace(/\/{2,}/g, '/')
			.replace(/^(https?:\/)/, '$1/');
	},

	base () {
		if (window.document.head.querySelector('base')) {
			return window.document.head.querySelector('base').href;
		} else {
			return window.location.origin + '/';
		}
	},

	resolve (path, base) {
		var result = [];

		path = path.replace(window.location.origin, '');

		if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0 || path.indexOf('//') === 0) {
			return path;
		}

		if (path.charAt(0) !== '/') {
			base = base || this.base();
			path = base + '/' + path;
			path = path.replace(window.location.origin, '');
		}

		path = path.replace(/\/{2,}/, '/');
		path = path.replace(/^\//, '');
		path = path.replace(/\/$/, '');

		var paths = path.split('/');

		for (var i = 0, l = paths.length; i < l; i++) {
			if (paths[i] === '.' || paths[i] === '') {
				continue;
			} else if (paths[i] === '..') {
				if (i > 0) {
					result.splice(i - 1, 1);
				}
			} else {
				result.push(paths[i]);
			}
		}

		return '/' + result.join('/');
	}

}
