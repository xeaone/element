import Unrender from './lib/unrender.js';
import Render from './lib/render.js';
import Global from './global.js';

export default class Binder {

	constructor () {
		this.data = {};
		this.values = [];
	}

	set (opt) {
		opt = opt || {};

		if (!opt.name) {
			throw new Error('Oxe.render.create - missing name');
		}

		if (!opt.value) {
			throw new Error('Oxe.render.create - missing value');
		}

		if (!opt.element) {
			throw new Error('Oxe.render.create - missing element');
		}

		if (!opt.container) {
			throw new Error('Oxe.render.create - missing container');
		}

		opt.scope = opt.scope || opt.container.getAttribute('o-scope');
		// opt.value = opt.value || opt.element.getAttribute(opt.name);
		opt.path = opt.path || Global.utility.binderPath(opt.value);

		opt.type = opt.type || Global.utility.binderType(opt.name);
		opt.names = opt.names || Global.utility.binderNames(opt.name);
		opt.values = opt.values || Global.utility.binderValues(opt.value);
		opt.modifiers = opt.modifiers || Global.utility.binderModifiers(opt.value);

		opt.keys = opt.keys || [opt.scope].concat(opt.values);

		if (opt.name === 'o-value' || opt.name === 'data-o-value') {
			opt.setup = true;
		}

		if (opt.name.indexOf('o-each') === 0 || opt.name.indexOf('data-o-each') === 0) {
			opt.cache = opt.element.removeChild(opt.element.firstElementChild);
		}

		return opt;
	}

	get (opt) {
		var items;

		if (opt.name === 'o-value') {
			items = this.values;
		} else {

			if (!(opt.scope in this.data)) {
				return null;
			}

			if (!(opt.path in this.data[opt.scope])) {
				return null;
			}

			items = this.data[opt.scope][opt.path];
		}

		for (var item of items) {
			if (item.element === opt.element && item.name === opt.name) {
				return item;
			}
		}

		return null;
	}

	add (opt) {
		var items;

		if (opt.name === 'o-value') {
			items = this.values;
		} else {

			if (!(opt.scope in this.data)) {
				this.data[opt.scope] = {};
			}

			if (!(opt.path in this.data[opt.scope])) {
				this.data[opt.scope][opt.path] = [];
			}

			items = this.data[opt.scope][opt.path];
		}

		items.push(opt);
	}

	remove (opt) {
		var items;

		if (opt.name === 'o-value') {
			items = this.values;
		} else {

			if (!(opt.scope in this.data)) {
				return;
			}

			if (!(opt.path in this.data[opt.scope])) {
				return;
			}

			items = this.data[opt.scope][opt.path];
		}

		for (var i = 0, l = items.length; i < l; i++) {
			if (items[i].element === opt.element) {
				return items.splice(i, 1);
			}
		}

	}

	each (scope, path, callback) {
		var i, key, binder, binders;
		var paths = this.data[scope];

		if (!path) {

			for (key in paths) {
				binders = paths[key];
				for (i = 0; i < binders.length; i++) {
					binder = binders[i];
					callback(binder, i, binders, paths, key);
				}
			}

		} else {

			for (key in paths) {
				if (key.indexOf(path) === 0) {
					if (key === path || key.slice(path.length).charAt(0) === '.') {
						binders = paths[key];

						for (i = 0; i < binders.length; i++) {
							binder = binders[i];
							callback(binder, i, binders, paths, key);
						}

					}
				}
			}

		}

	}

	unrender (opt) {
		if (opt.type in Unrender) {
			Unrender[opt.type](opt);
		} else {
			Unrender.default(opt);
		}
	}

	render (opt) {
		if (opt.type in Render) {
			Render[opt.type](opt);
		} else {
			Render.default(opt);
		}
	}

	modifyData (opt, data) {

		if (!opt.modifiers.length) {
			return data;
		}

		if (!Global.methods.data[opt.scope]) {
			return data;
		}

		for (var modifier of opt.modifiers) {
			var scope = Global.methods.data[opt.scope];
			if (scope) {
				data = scope[modifier].call(opt.container, data);
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

		if (this.skipChildren(element) === false) {
			for (var child of element.children) {
				this.eachElement(child, scope, callback);
			}
		}

	};

	eachAttribute (element, callback) {
		for (var attribute of element.attributes) {
			if (
				attribute &&
				attribute.value &&
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
					path: Global.utility.binderPath(attribute.value)
				});

				this.remove(binder);
				this.unrender(binder);

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
				this.render(binder);

			});
		});
	}

}
