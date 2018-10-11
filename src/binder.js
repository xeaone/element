import Methods from './methods.js';
import Utility from './utility.js';
import Render from './render.js';
import Model from './model.js';

class Binder {

	constructor () {
		this.data = {};
		this.values = [];
		this.submits = [];
		this.elements = new Map();
	}

	set (opt) {
		const self = this;

		opt = opt || {};

		if (opt.name === undefined) throw new Error('Oxe.binder.set - missing name');
		if (opt.value === undefined) throw new Error('Oxe.binder.set - missing value');
		if (opt.element === undefined) throw new Error('Oxe.binder.set - missing element');
		if (opt.container === undefined) throw new Error('Oxe.binder.set - missing container');

		opt.scope = opt.scope || opt.container.getAttribute('o-scope');
		// opt.value = opt.value || opt.element.getAttribute(opt.name);
		opt.path = opt.path || Utility.binderPath(opt.value);

		opt.type = opt.type || Utility.binderType(opt.name);
		opt.names = opt.names || Utility.binderNames(opt.name);
		opt.values = opt.values || Utility.binderValues(opt.value);
		opt.modifiers = opt.modifiers || Utility.binderModifiers(opt.value);

		opt.keys = opt.keys || [opt.scope].concat(opt.values);

		// Object.defineProperty(opt, 'data', {
		// 	enumerable: true,
		// 	get: function () {
		// 		let data = Model.get(opt.keys);
		//
		// 		if (
		// 			opt.name.indexOf('o-on') !== 0 &&
		// 			opt.name.indexOf('data-o-on') !== 0
		// 		) {
		// 			data = self.modifyData(opt, data);
		// 		}
		//
		// 		return data;
		// 	}
		// });

		// if (opt.name.indexOf('o-each') === 0 || opt.name.indexOf('data-o-each') === 0) {
		// 	opt.cache = opt.element.removeChild(opt.element.firstElementChild);
		// }

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

		for (const item of items) {
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
			throw new Error('Oxe - duplicate attribute');
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
		var scope, paths;

		if (typeof path === 'string') {
			paths = path.split('.');
			scope = paths[0];
		} else {
			paths = path;
			scope = paths[0];
		}

		var binderPaths = this.data[scope];
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
				for (var i = 0, l = binders.length; i < l; i++) {
					var binder = binders[i];
					callback(binder);
				}
			}
		}
	}

	modifyData (opt, data) {

		if (!opt.modifiers.length) {
			return data;
		}

		if (!Methods.data[opt.scope]) {
			return data;
		}

		for (let modifier of opt.modifiers) {
			let scope = Methods.data[opt.scope];

			if (scope) {
				if (modifier in scope) {
					data = scope[modifier].call(opt.container, data);
				} else {
					throw new Error(`Oxe - modifier ${modifier} not found in ${opt.scope} scope`);
				}
			}

		}

		return data;
	}

	skipChildren (element) {

		if (
			element.nodeName === 'STYLE'
			&& element.nodeName === 'SCRIPT'
			&& element.nodeName === 'OBJECT'
			&& element.nodeName === 'IFRAME'
		) {
			return true;
		}

		for (var attribute of element.attributes) {
			if (
				attribute.name.indexOf('o-each') === 0 ||
				attribute.name.indexOf('data-o-each') === 0
			) {
				return true;
			}
		}

		return false;
	}

	eachElement (element, scope, callback) {
		var sid = scope.getAttribute('o-scope') || scope.getAttribute('data-o-scope');
		var eid = element.getAttribute('o-scope') || element.getAttribute('data-o-scope');
		var idCheck = eid ? eid === sid : true;

		if (
			element.nodeName !== 'O-ROUTER'
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

		if (idCheck && this.skipChildren(element) === false) {
			for (var child of element.children) {
				this.eachElement(child, scope, callback);
			}
		}

	}

	eachAttribute (element, callback) {
		for (const attribute of element.attributes) {
			if (
				attribute.name.indexOf('o-') === 0 ||
				attribute.name.indexOf('data-o-') === 0
			) {
				callback.call(this, attribute);
			}
		}
	}

	unbind (element, scope) {
		scope = scope || element;

		this.eachElement(element, scope, function (child) {
			this.eachAttribute(child, function (attribute) {

				var binder = this.get({
					element: child,
					container: scope,
					name: attribute.name,
					value: attribute.value,
					scope: scope.getAttribute('o-scope'),
					path: Utility.binderPath(attribute.value)
				});

				this.remove(binder);
				Unrender.default(binder);

			});
		});
	}

	bind (element, scope) {
		scope = scope || element;

		this.eachElement(element, scope, function (child) {
			this.eachAttribute(child, function (attribute) {

				var binder = this.set({
					element: child,
					container: scope,
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
