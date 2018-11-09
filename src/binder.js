import Methods from './methods.js';
import Utility from './utility.js';
import Render from './render.js';
import Model from './model.js';

class Binder {

	constructor () {
		this.data = {};
		this.elements = new Map();
	}

	create (data) {
		var binder = {};

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
	}

	get (data) {
		var binder;

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

		var items = this.data[binder.scope][binder.path];

		for (var i = 0, l = items.length; i < l; i++) {
			var item = items[i];

			if (item.element === binder.element && item.name === binder.name) {
				return item;
			}

		}

		return null;
	}

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
	}

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

		var items = this.data[binder.scope][binder.path];

		for (var i = 0, l = items.length; i < l; i++) {

			if (items[i].element === binder.element) {
				return items.splice(i, 1);
			}

		}

	}

	each (path, callback) {
		var paths = typeof path === 'string' ? path.split('.') : path;
		var scope = paths[0];

		var binderPaths = this.data[scope];
		if (!binderPaths) return;
		var relativePath = paths.slice(1).join('.');

		for (var binderPath in binderPaths) {

			if (
				relativePath === '' ||
				binderPath.indexOf(relativePath) === 0 &&
				(
					binderPath === relativePath ||
					binderPath.charAt(relativePath.length) === '.'
				)
			) {
				var binders = binderPaths[binderPath];

				for (var c = 0, t = binders.length; c < t; c++) {
					callback(binders[c]);
				}

			}

		}

	}

	// make async
	piper (binder, data) {

		if (!binder.pipes.length) {
			return data;
		}

		var methods = Methods.get(binder.scope);

		if (!methods) {
			return data;
		}

		for (var i = 0, l = binder.pipes.length; i < l; i++) {
			var method = binder.pipes[i];

			if (method in methods) {
				data = methods[method].call(binder.container, data);
			} else {
				throw new Error(`Oxe - pipe method ${method} not found in scope ${binder.scope}`);
			}

		}

		return data;
	}

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

		for (var i = 0, l = element.attributes.length; i < l; i++) {
			var attribute = element.attributes[i];

			if (attribute.name.indexOf('o-each') === 0) {
				return true;
			}

		}

		return false;
	}

	eachElement (element, callback) {
		var elements = element.querySelectorAll('*');

		for (var i = 0, l = elements.length; i < l; i++) {
			var e = elements[i];

			if (
				e.nodeName !== 'SLOT'
				&& e.nodeName !== 'O-ROUTER'
				&& e.nodeName !== 'TEMPLATE'
				&& e.nodeName !== '#document-fragment'
				// && !e.hasAttribute('o-setup')
				// && !e.hasAttribute('o-router')
				// && !e.hasAttribute('o-compiled')
				// && !e.hasAttribute('o-external')
			) {
				callback.call(this, e);
			}

			if (this.skipChildren(e)) {
				i = i + e.children.length;
			}

		}

	}

	eachAttribute (element, callback) {
		var attributes = element.attributes;

		for (var i = 0, l = attributes.length; i < l; i++) {
			var a = attributes[i];

			if (
				a.name.indexOf('o-') === 0
				&& a.name !== 'o-scope'
				&& a.name !== 'o-reset'
				// && a.name !== 'o-status'
				&& a.name !== 'o-action'
				&& a.name !== 'o-method'
				&& a.name !== 'o-enctype'
			) {
				callback.call(this, a);
			}

		}

	}

	unbind (element, container, scope) {

		if (!scope) throw new Error('Oxe - unbind requires scope argument');
		if (!element) throw new Error('Oxe - unbind requires element argument');
		if (!container) throw new Error('Oxe - unbind requires container argument');

		this.eachElement(element, function (child) {
			this.eachAttribute(child, function (attribute) {

				var binder = this.get({
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
	}

	bind (element, container, scope) {

		if (!scope) throw new Error('Oxe - bind requires scope argument');
		if (!element) throw new Error('Oxe - bind requires element argument');
		if (!container) throw new Error('Oxe - bind requires container argument');

		this.eachElement(element, function (child) {
			this.eachAttribute(child, function (attribute) {

				var binder = this.create({
					scope: scope,
					element: child,
					container: container,
					name: attribute.name,
					value: attribute.value
				});

				var result = this.add(binder);

				if (result !== false) {
					Render.default(binder);
				}

			});
		});
	}

}

export default new Binder();
