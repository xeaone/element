
const PathPattern = '(\\$)(\\w+)($|,|\\s+|\\.|\\|)';
const KeyPattern = '({{\\$)(\\w+)((-(key|index))?}})';

export default {

	PREFIX: /o-/,
	PIPE: /\s?\|\s?/,
	PIPES: /\s?,\s?|\s+/,

	// whitespacePattern: /^\s+$/g,

	keyPattern: new RegExp(KeyPattern, 'i'),
	keyPatternGlobal: new RegExp(KeyPattern, 'ig'),

	pathPattern: new RegExp(PathPattern, 'i'),
	pathPatternGlobal: new RegExp(PathPattern, 'ig'),

	value (element) {
		const type = this.type(element);

		if (
			(type === 'radio' || type === 'checkbox') &&
			(element.nodeName === 'INPUT' || element.nodeName.indexOf('-INPUT') !== -1)
		) {
			const name = this.name(element);
			const query = 'input[type="' + type + '"][name="' + name + '"]';
			const form = this.form(element);
			const elements = form ? this.form(element).querySelectorAll(query) : [ element ];
			const multiple = elements.length > 1;

			let result =  multiple ? [] : undefined;

			for (let i = 0, l = elements.length; i < l; i++) {
				const element = elements[i];
				const checked = this.checked(element);

				if (!checked) continue;

				if (multiple) {
					result.push(this.value(element))
				} else {
					result = this.value(element);
					break;
				}

			}

			return result;
		} else if (
			element.nodeName === 'INPUT' || element.nodeName.indexOf('-INPUT') !== -1 ||
			element.nodeName === 'OPTION' || element.nodeName.indexOf('-OPTION') !== -1 ||
			element.nodeName === 'TEXTAREA' || element.nodeName.indexOf('-TEXTAREA') !== -1
		) {
			return element.value;
		} else if (element.nodeName === 'SELECT' || element.nodeName.indexOf('-SELECT') !== -1) {
			const multiple = this.multiple(element);
			const options = element.options;
			let result = multiple ? [] : undefined;

			for (let i = 0, l = options.length; i < l; i++) {
				const option = options[i];
				const selected = this.selected(option);

				if (!selected) continue;

				const value = this.value(option);

				if (multiple) {
					result.push(value);
				} else {
					result = this.value(option);
					break;
				}

			}

			return result;
		}
	},

	form (element) {
		if (element.form) {
			return element.form;
		} else {
			while (element = element.parentElement) {
				if (element.nodeName === 'FORM' || element.nodeName.indexOf('-FORM') !== -1) {
					return element;
				}
			}
		}
	},

	type (element) {
		if (typeof element.type === 'string') {
			return element.type;
		} else {
			return element.getAttribute('type');
		}
	},

	name (element) {
		if (typeof element.name === 'string') {
			return element.name;
		} else {
			return element.getAttribute('name');
		}
	},

	checked (element) {
		if (typeof element.checked === 'boolean') {
			return element.checked;
		} else {
			switch (element.getAttribute('checked')) {
				case undefined: return false;
				case 'true': return true;
				case null: return false;
				case '': return true;
				default: return false
			}
		}
	},

	selected (element) {
		if (typeof element.selected === 'boolean') {
			return element.selected;
		} else {
			switch (element.getAttribute('selected')) {
				case undefined: return false;
				case 'true': return true;
				case null: return false;
				case '': return true;
				default: return false
			}
		}
	},

	multiple (element) {
		if (typeof element.multiple === 'boolean') {
			return 	element.multiple;
		} else {
			switch (element.getAttribute('multiple')) {
				case undefined: return false;
				case 'true': return true;
				case null: return false;
				case '': return true;
				default: return false
			}
		}
	},

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
		const elements = form.querySelectorAll('[o-value], select[name] , input[name], textarea[name]');
		const data = {};

		for (let i = 0, l = elements.length; i < l; i++) {
			const element = elements[i];

			// if (element.nodeName === 'OPTION') continue;
			if (element.nodeName.indexOf('OPTION') !== -1) continue;

			const value = element.getAttribute('o-value');
			const values = this.binderValues(value);
			const name = element.getAttribute('name') || values.slice(-1)[0];

			if (data[name]) {

				if (typeof data[name] !== 'object') {
					data[name] = [data[name]];
				}

				data[name].push(this.getByPath(model, values));
			} else {
				data[name] = this.getByPath(model, values);
			}

		}

		return data;
	},

	formReset (form, model) {
		const elements = form.querySelectorAll('[o-value]');

		for (let i = 0, l = elements.length; i < l; i++) {
			const element = elements[i];

			if (element.nodeName === 'OPTION') continue;

			const value = element.getAttribute('o-value');

			if (!value) continue;

			const values = this.binderValues(value);

			this.setByPath(model, values, '');
		}

	},

	// walker (node, callback) {
	// 	callback(node);
	// 	node = node.firstChild;
	// 	while (node) {
	// 	    this.walker(node, callback);
	// 	    node = node.nextSibling;
	// 	}
	// },

	// rewrite (target, variable, path, key) {
	//
	// 	if (target.nodeType === 3) {
	// 		target.nodeValue = target.nodeValue.replace(this.keyPatternGlobal, `${key}`);
	// 	} else if (target.nodeType === 1) {
	// 		for (let i = 0, l = target.attributes.length; i < l; i++) {
	// 			const attribute = target.attributes[i];
	// 			attribute.value = attribute.value.replace(this.keyPatternGlobal, `${key}`);
	// 			attribute.value = attribute.value.replace(this.pathPatternGlobal, `${path}.${key}$3`);
	// 		}
	// 	}
	//
	// 	let node = target.firstChild;
	//
	// 	while (node) {
	// 	    this.rewrite(node, variable, path, key);
	// 	    node = node.nextSibling;
	// 	}
	//
	// },

	// traverse (data, path, callback) {
	// 	let keys = typeof path === 'string' ? path.split('.') : path;
	// 	let last = keys.length - 1;
	//
	// 	for (let i = 0; i < last; i++) {
	// 		let key = keys[i];
	//
	// 		if (!(key in data)) {
	// 			if (typeof callback === 'function') {
	// 				callback(data, key, i, keys);
	// 			} else {
	// 				return undefined;
	// 			}
	// 		}
	//
	// 		data = data[key];
	// 	}
	//
	// 	return {
	// 		data: data,
	// 		key: keys[last]
	// 	}
	// },

	setByPath (data, path, value) {
		const keys = typeof path === 'string' ? path.split('.') : path;
		const last = keys.length - 1;

		for (let i = 0; i < last; i++) {
			const key = keys[i];

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
		const keys = typeof path === 'string' ? path.split('.') : path;
		const last = keys.length - 1;

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

};
