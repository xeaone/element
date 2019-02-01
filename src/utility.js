
export default {

	PREFIX: /o-/,
	ROOT: /^(https?:)?\/?\//,

	DOT: /\.+/,
	PIPE: /\s?\|\s?/,
	PIPES: /\s?,\s?|\s+/,
	VARIABLE_START: '(^|(\\|+|\\,+|\\s))',
	VARIABLE_END: '(?:)',

	binderNames (data) {
		data = data.split(this.PREFIX)[1];
		return data ? data.split('-') : [];
	},

	binderValues (data) {
		data = data.split(this.PIPE)[0];
		return data ? data.split('.') : [];
	},

	binderPipes (data) {
		data = data.split(this.PIPE)[1];
		return data ? data.split(this.PIPES) : [];
	},

	ensureElement (data) {
		data.query = data.query || '';
		data.scope = data.scope || document.body;

		let element = data.scope.querySelector(`${data.name}${data.query}`);

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

		for (let i = 0, l = data.attributes.length; i < l; i++) {
			let attribute = data.attributes[i];
			element.setAttribute(attribute.name, attribute.value);
		}

		return element;
	},

	formData (form, model) {
		let elements = form.querySelectorAll('[o-value]');
		let data = {};

		for (let i = 0, l = elements.length; i < l; i++) {
			let element = elements[i];

			if (element.nodeName === 'OPTION') continue;

			let value = element.getAttribute('o-value');

			if (!value) continue;

			let values = this.binderValues(value);

			data[values[values.length-1]] = this.getByPath(model, values);
		}

		return data;
	},

	formReset (form, model) {
		let elements = form.querySelectorAll('[o-value]');

		for (let i = 0, l = elements.length; i < l; i++) {
			let element = elements[i];

			if (element.nodeName === 'OPTION') continue;

			let value = element.getAttribute('o-value');

			if (!value) continue;

			let values = this.binderValues(value);

			this.setByPath(model, values, '');
		}

	},

	walker (node, callback) {
		callback(node);
		// node = node.firstElementChild;
		node = node.firstChild;
		while (node) {
		    this.walker(node, callback);
		    // node = node.nextElementSibling;
		    node = node.nextSibling;
		}
	},

	replaceEachVariable (element, variable, path, key) {
		variable = variable.toLowerCase();

		let pattern = new RegExp(this.VARIABLE_START + variable + this.VARIABLE_END, 'ig');

		this.walker(element, function (node) {
			if (node.nodeType === 3) {
				let value = node.nodeValue.toLowerCase();
				if (value === `$${variable}` || value === '$index') {
					node.nodeValue = key;
				}
			} else if (node.nodeType === 1) {
				for (let i = 0, l = node.attributes.length; i < l; i++) {
					let attribute = node.attributes[i];
					if (attribute.name.indexOf('o-') === 0) {
						attribute.value = attribute.value.replace(pattern, `$1${path}.${key}`);
					}
				}
			}
		});
	},

	traverse (data, path, callback) {
		let keys = typeof path === 'string' ? path.split('.') : path;
		let last = keys.length - 1;

		for (let i = 0; i < last; i++) {
			let key = keys[i];

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
		let keys = typeof path === 'string' ? path.split('.') : path;
		let last = keys.length - 1;

		for (let i = 0; i < last; i++) {
			let key = keys[i];

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
		let keys = typeof path === 'string' ? path.split('.') : path;
		let last = keys.length - 1;

		for (let i = 0; i < last; i++) {
			let key = keys[i];

			if (!(key in data)) {
				return undefined;
			} else {
				data = data[key];
			}

		}

		return data[keys[last]];
	}

	// getScope (element) {
	//
	// 	if (!element) {
	// 		return;
	// 	}
	//
	// 	if (element.hasAttribute('o-scope')) {
	// 		return element;
	// 	}
	//
	// 	if (element.parentNode) {
	// 		return this.getScope(element.parentNode);
	// 	}
	//
	// 	// console.warn('Oxe.utility - could not find container scope');
	// }

}
