import Methods from './methods.js';
import Utility from './utility.js';
import Render from './render.js';
import Model from './model.js';

class Binder {

	constructor () {
		this.data = {};
		this.elements = new Map();
	}

	set (opt) {
		opt = opt || {};

		if (opt.name === undefined) throw new Error('Oxe.binder.set - missing name');
		if (opt.value === undefined) throw new Error('Oxe.binder.set - missing value');
		if (opt.scope === undefined) throw new Error('Oxe.binder.set - missing scope');
		if (opt.element === undefined) throw new Error('Oxe.binder.set - missing element');
		if (opt.container === undefined) throw new Error('Oxe.binder.set - missing container');

		opt.names = opt.names || Utility.binderNames(opt.name);
		opt.pipes = opt.pipes || Utility.binderPipes(opt.value);
		opt.values = opt.values || Utility.binderValues(opt.value);

		opt.path = opt.values.join('.');
		opt.type = opt.type || opt.names[0];
		opt.keys = [opt.scope].concat(opt.values);

		return opt;
	}

	get (opt) {

		if (!(opt.scope in this.data)) {
			return null;
		}

		if (!(opt.path in this.data[opt.scope])) {
			return null;
		}

		const items = this.data[opt.scope][opt.path];

		for (let i = 0, l = items.length; i < l; i++) {
			const item = items[i];

			if (item.element === opt.element && item.name === opt.name) {
				return item;
			}

		}

		return null;
	}

	add (opt) {

		if (!this.elements.has(opt.element)) {
			this.elements.set(opt.element, new Map());
		}

		if (!this.elements.get(opt.element).has(opt.names[0])) {
			this.elements.get(opt.element).set(opt.names[0], opt);
		} else {
			throw new Error(`Oxe - duplicate attribute ${opt.names[0]}`);
		}

		if (!(opt.scope in this.data)) {
			this.data[opt.scope] = {};
		}

		if (!(opt.path in this.data[opt.scope])) {
			this.data[opt.scope][opt.path] = [];
		}

		this.data[opt.scope][opt.path].push(opt);
	}

	remove (opt) {

		if (this.elements.has(opt.element)) {

			if (this.elements.get(opt.element).has(opt.names[0])) {
				this.elements.get(opt.element).remove(opt.names[0]);
			}

			if (this.elements.get(opt.elements).length === 0) {
				this.elements.remove(opt.elements);
			}

		}

		if (!(opt.scope in this.data)) {
			return;
		}

		if (!(opt.path in this.data[opt.scope])) {
			return;
		}

		const items = this.data[opt.scope][opt.path];

		for (let i = 0, l = items.length; i < l; i++) {

			if (items[i].element === opt.element) {
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

	piper (opt, data) {

		if (!opt.pipes.length) {
			return data;
		}

		const methods = Methods.get(opt.scope);

		if (!methods) {
			return data;
		}

		for (let i = 0, l = opt.pipes.length; i < l; i++) {
			const method = opt.pipes[i];

			if (method in methods) {
				data = methods[method].call(opt.container, data);
			} else {
				throw new Error(`Oxe - pipe method ${method} not found in scope ${opt.scope}`);
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

				const binder = this.set({
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
