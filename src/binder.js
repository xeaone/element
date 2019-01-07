import Methods from './methods.js';
import Utility from './utility.js';
import Unrender from './unrender.js';
import Render from './render.js';

export default {

	data: {},
	elements: new Map(),

	create (data) {
		let binder = {};

		if (data.name === undefined) throw new Error('Oxe.binder.create - missing name');
		if (data.value === undefined) throw new Error('Oxe.binder.create - missing value');
		if (data.scope === undefined) throw new Error('Oxe.binder.create - missing scope');
		if (data.element === undefined) throw new Error('Oxe.binder.create - missing element');
		if (data.container === undefined) throw new Error('Oxe.binder.create - missing container');

		binder.name = data.name;
		binder.value = data.value;
		binder.scope = data.scope;
		binder.element = data.element;
		binder.container = data.container;

		binder.names = data.names || Utility.binderNames(data.name);
		binder.pipes = data.pipes || Utility.binderPipes(data.value);
		binder.values = data.values || Utility.binderValues(data.value);

		binder.context = {};
		binder.path = binder.values.join('.');
		binder.type = binder.type || binder.names[0];
		binder.keys = [binder.scope].concat(binder.values);

		return binder;
	},

	get (data) {
		let binder;

		if (typeof data === 'string') {
			binder = {};
			binder.scope = data.split('.').slice(0, 1).join('.');
			binder.path = data.split('.').slice(1).join('.');
		} else {
			binder = data;
		}

		if (!(binder.scope in this.data)) {
			return null;
		}

		if (!(binder.path in this.data[binder.scope])) {
			return null;
		}

		let items = this.data[binder.scope][binder.path];

		for (let i = 0, l = items.length; i < l; i++) {
			let item = items[i];

			if (item.element === binder.element && item.name === binder.name) {
				return item;
			}

		}

		return null;
	},

	add (binder) {

		if (!this.elements.has(binder.element)) {
			this.elements.set(binder.element, new Map());
		}

		if (!this.elements.get(binder.element).has(binder.names[0])) {
			this.elements.get(binder.element).set(binder.names[0], binder);
		} else {
			return false;
			// throw new Error(`Oxe - duplicate attribute ${binder.scope} ${binder.names[0]} ${binder.value}`);
		}

		if (!(binder.scope in this.data)) {
			this.data[binder.scope] = {};
		}

		if (!(binder.path in this.data[binder.scope])) {
			this.data[binder.scope][binder.path] = [];
		}

		this.data[binder.scope][binder.path].push(binder);
	},

	remove (binder) {

		if (this.elements.has(binder.element)) {

			if (this.elements.get(binder.element).has(binder.names[0])) {
				this.elements.get(binder.element).remove(binder.names[0]);
			}

			if (this.elements.get(binder.elements).length === 0) {
				this.elements.remove(binder.elements);
			}

		}

		if (!(binder.scope in this.data)) {
			return;
		}

		if (!(binder.path in this.data[binder.scope])) {
			return;
		}

		let items = this.data[binder.scope][binder.path];

		for (let i = 0, l = items.length; i < l; i++) {

			if (items[i].element === binder.element) {
				return items.splice(i, 1);
			}

		}

	},

	piper (binder, data) {

		if (!binder.pipes.length) {
			return data;
		}

		let methods = Methods.get(binder.scope);

		if (!methods) {
			return data;
		}

		for (let i = 0, l = binder.pipes.length; i < l; i++) {
			let method = binder.pipes[i];

			if (method in methods) {
				data = methods[method].call(binder.container, data);
			} else {
				throw new Error(`Oxe - pipe method ${method} not found in scope ${binder.scope}`);
			}

		}

		return data;
	},

	each (path, callback) {
		let paths = typeof path === 'string' ? path.split('.') : path;
		let scope = paths[0];

		let binderPaths = this.data[scope];
		if (!binderPaths) return;
		let relativePath = paths.slice(1).join('.');

		for (let binderPath in binderPaths) {

			if (
				relativePath === '' ||
				binderPath.indexOf(relativePath) === 0 &&
				(
					binderPath === relativePath ||
					binderPath.charAt(relativePath.length) === '.'
				)
			) {
				let binders = binderPaths[binderPath];

				for (let c = 0, t = binders.length; c < t; c++) {
					callback(binders[c]);
				}

			}

		}

	},

	skipChildren (element) {

		if (element.nodeName === '#document-fragment') {
			return false;
		}

		if (
			element.nodeName === 'STYLE'
			&& element.nodeName === 'SCRIPT'
			&& element.nodeName === 'OBJECT'
			&& element.nodeName === 'IFRAME'
		) {
			return true;
		}

		for (let i = 0, l = element.attributes.length; i < l; i++) {
			let attribute = element.attributes[i];

			if (attribute.name.indexOf('o-each') === 0) {
				return true;
			}

		}

		return false;
	},

	eachElement (element, callback) {

		if (
			element.nodeName !== 'SLOT'
			&& element.nodeName !== 'O-ROUTER'
			&& element.nodeName !== 'TEMPLATE'
			&& element.nodeName !== '#document-fragment'
		) {
			callback.call(this, element);
		}

		if (!this.skipChildren(element)) {
			element = element.firstElementChild;

			while (element) {
			    this.eachElement(element, callback);
			    element = element.nextElementSibling;
			}
		}

	},

	eachAttribute (element, callback) {
		let attributes = element.attributes;

		for (let i = 0, l = attributes.length; i < l; i++) {
			let attribute = attributes[i];

			if (
				attribute.name.indexOf('o-') === 0
				&& attribute.name !== 'o-scope'
				&& attribute.name !== 'o-reset'
				&& attribute.name !== 'o-action'
				&& attribute.name !== 'o-method'
				&& attribute.name !== 'o-enctype'
			) {
				callback.call(this, attribute);
			}

		}

	},

	unbind (element, container, scope) {

		if (!scope) throw new Error('Oxe - unbind requires scope argument');
		if (!element) throw new Error('Oxe - unbind requires element argument');
		if (!container) throw new Error('Oxe - unbind requires container argument');

		this.eachElement(element, function (child) {
			this.eachAttribute(child, function (attribute) {

				let binder = this.get({
					scope: scope,
					element: child,
					container: container,
					name: attribute.name,
					value: attribute.value
				});

				this.remove(binder);

				Unrender.default(binder);
			});
		});
	},

	bind (element, container, scope) {

		if (!scope) throw new Error('Oxe - bind requires scope argument');
		if (!element) throw new Error('Oxe - bind requires element argument');
		if (!container) throw new Error('Oxe - bind requires container argument');

		this.eachElement(element, function (child) {
			this.eachAttribute(child, function (attribute) {

				let binder = this.create({
					scope: scope,
					element: child,
					container: container,
					name: attribute.name,
					value: attribute.value
				});

				let result = this.add(binder);

				if (result !== false) {
					Render.default(binder);
				}

			});
		});
	}

};
