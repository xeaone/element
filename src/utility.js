
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

	ensureElement (data) {
		data.query = data.query || '';
		data.scope = data.scope || document.body;

		var element = data.scope.querySelector(`${data.name}${data.query}`);

		if (!element) {
			element = document.createElement(data.name);

			if (data.position === 'afterbegin') {
				data.scope.insertBefore(element, data.scope.firstChild);
			} else if (data.position === 'beforeend') {
				data.scope.appendChild(element);
			} else {
				data.scope.appendChild(element);
			}

		}

		for (var attribute of data.attributes) {
			element.setAttribute(attribute.name, attribute.value);
		}

		return element;
	},

	formData (form, model) {
		var elements = form.querySelectorAll('[o-value]');
		var data = {};

		var done = 0;
		var count = 0;

		for (const element of elements) {
			if (element.nodeName === 'OPTION') continue;

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

	replaceEachVariable (element, variable, path, key) {
		const self = this;
	 	const iindex = '$index';
		const vindex = '$' + variable;
		// const pattern = new RegExp('\\$index|\\$' + variable, 'ig');

		self.walker(element, function (node) {
			if (node.nodeType === 3) {
				if (node.nodeValue === vindex || node.nodeValue === iindex) {
					node.nodeValue = key;
				}
			} else if (node.nodeType === 1) {
				for (let i = 0, l = node.attributes.length; i < l; i++) {
					const attribute = node.attributes[i];

					if (attribute.name.indexOf('o-') === 0 || attribute.name.indexOf('data-o-') === 0) {

						// attribute.value = attribute.value.replace(pattern, key);
						// if (value === variable || value.indexOf(variable) === 0) {
							// attribute.value = path + '.' + key + attribute.value.slice(variable.length);
						// }

						const value = attribute.value;
						const length = value.length;
						const last = length - 1;
						const result = [];

						let item = '';

						for (let index = 0; index < length; index++) {
						 	const char = value[index];

							if (char === '$' && value.slice(index, iindex.length) === iindex) {
								item += key;
								index = index + iindex.length - 1;
							} else if (char === '$' && value.slice(index, vindex.length) === vindex) {
								item += key;
								index = index + vindex.length - 1;
							} else {
								item += char;
							}

							if (char === ' ' || char === '|' || char === ',' || index === last) {

								if (item.indexOf(variable) === 0) {
									const tail = item.slice(variable.length);
									result.push(path + '.' + key + tail);
								} else {
									result.push(item);
								}

								item = '';
							}

						}

						attribute.value = result.join('');
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

	// getScope (element) {
	//
	// 	if (!element) {
	// 		return;
	// 	}
	//
	// 	if (element.hasAttribute('o-scope') || element.hasAttribute('data-o-scope')) {
	// 		return element;
	// 	}
	//
	// 	if (element.parentNode) {
	// 		return this.getScope(element.parentNode);
	// 	}
	//
	// 	// console.warn('Oxe.utility - could not find container scope');
	// },

	ready (callback) {
		if (callback) {
			if (window.document.readyState !== 'interactive' && window.document.readyState !== 'complete') {
				window.document.addEventListener('DOMContentLoaded', function _ () {
					callback();
					window.document.removeEventListener('DOMContentLoaded', _);
				}, true);
			} else {
				callback();
			}
		}
	}

}
