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
		const binder = {};

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

	get (binder) {

		if (!(binder.scope in this.data)) {
			return null;
		}

		if (!(binder.path in this.data[binder.scope])) {
			return null;
		}

		const items = this.data[binder.scope][binder.path];

		for (let i = 0, l = items.length; i < l; i++) {
			const item = items[i];

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
			throw new Error(`Oxe - duplicate attribute ${binder.names[0]}`);
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

		const items = this.data[binder.scope][binder.path];

		for (let i = 0, l = items.length; i < l; i++) {

			if (items[i].element === binder.element) {
				return items.splice(i, 1);
			}

		}

	}

	each (path, callback) {
		const paths = typeof path === 'string' ? path.split('.') : path;
		const scope = paths[0];

		const binderPaths = this.data[scope];
		if (!binderPaths) return;
		const relativePath = paths.slice(1).join('.');

		for (const binderPath in binderPaths) {

			if (
				relativePath === '' ||
				binderPath.indexOf(relativePath) === 0 &&
				(
					binderPath === relativePath ||
					binderPath.charAt(relativePath.length) === '.'
				)
			) {
				const binders = binderPaths[binderPath];

				for (let c = 0, t = binders.length; c < t; c++) {
					callback(binders[c]);
				}

			}

		}

	}

	piper (binder, data) {

		if (!binder.pipes.length) {
			return data;
		}

		const methods = Methods.get(binder.scope);

		if (!methods) {
			return data;
		}

		for (let i = 0, l = binder.pipes.length; i < l; i++) {
			const method = binder.pipes[i];

			if (method in methods) {
				data = methods[method].call(binder.container, data);
			} else {
				throw new Error(`Oxe - pipe method ${method} not found in scope ${binder.scope}`);
			}

		}

		return data;
	}

	checkChildren (element) {

		if (element.nodeName === '#document-fragment') {
			return true;
		}

		if (
			element.nodeName === 'STYLE'
			&& element.nodeName === 'SCRIPT'
			&& element.nodeName === 'OBJECT'
			&& element.nodeName === 'IFRAME'
		) {
			return false;
		}

		for (let i = 0, l = element.attributes.length; i < l; i++) {
			const attribute = element.attributes[i];

			if (
				attribute.name.indexOf('o-each') === 0 ||
				attribute.name.indexOf('data-o-each') === 0
			) {
				return false;
			}

		}

		return true;
	}

	eachElement (element, container, scope, callback) {

		if (
			element.nodeName !== 'O-ROUTER'
			&& element.nodeName !== 'TEMPLATE'
			&& element.nodeName !== '#document-fragment'
			&& !element.hasAttribute('o-scope')
			&& !element.hasAttribute('o-setup')
			&& !element.hasAttribute('o-router')
			&& !element.hasAttribute('o-compiled')
			&& !element.hasAttribute('o-external')
			&& !element.hasAttribute('data-o-scope')
			&& !element.hasAttribute('data-o-setup')
			&& !element.hasAttribute('data-o-router')
			&& !element.hasAttribute('data-o-compiled')
			&& !element.hasAttribute('data-o-external')
		) {
			callback.call(this, element);
		}

		if (this.checkChildren(element)) {

			for (let i = 0, l = element.children.length; i < l; i++) {
				const child = element.children[i];
				this.eachElement(child, container, scope, callback);
			}

		}

	}

	eachAttribute (element, callback) {

		for (let i = 0, l = element.attributes.length; i < l; i++) {
			const attribute = element.attributes[i];

			if (
				(attribute.name.indexOf('o-') === 0
				|| attribute.name.indexOf('data-o-') === 0)
				&& attribute.name !== 'o-reset'
				&& attribute.name !== 'o-action'
				&& attribute.name !== 'o-method'
				&& attribute.name !== 'o-enctype'
				&& attribute.name !== 'data-o-reset'
				&& attribute.name !== 'data-o-action'
				&& attribute.name !== 'data-o-method'
				&& attribute.name !== 'data-o-enctype'
			) {
				callback.call(this, attribute);
			}

		}

	}

	unbind (element, container) {
		container = container || element;

		const scope = container.getAttribute('o-scope') || container.getAttribute('data-o-scope');

		if (!scope) throw new Error('Oxe - bind requires container element scope attribute');

		this.eachElement(element, container, scope, function (child) {
			this.eachAttribute(child, function (attribute) {

				const binder = this.get({
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

	bind (element, container) {
		container = container || element;

		const scope = container.getAttribute('o-scope') || container.getAttribute('data-o-scope');

		if (!scope) throw new Error('Oxe - bind requires container element scope attribute');

		this.eachElement(element, container, scope, function (child) {
			this.eachAttribute(child, function (attribute) {

				const binder = this.create({
					scope: scope,
					element: child,
					container: container,
					name: attribute.name,
					value: attribute.value
				});

				this.add(binder);
				Render.default(binder);
			});
		});
	}

}

export default new Binder();
