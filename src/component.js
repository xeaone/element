import Methods from './methods.js';
import Binder from './binder.js';
import Model from './model.js';

class Component {

	constructor () {
		this.data = {};
		this.compiled = false;
	}

	setup (options) {
		options = options || {};

		if (options.components && options.components.length) {
			for (var i = 0, l = options.components.length; i < l; i++) {
				this.define(options.components[i]);
			}
		}

	}

	renderSlot (target, source, scope) {
		var targetSlots = target.querySelectorAll('slot[name]');

		for (var i = 0, l = targetSlots.length; i < l; i++) {
			var targetSlot = targetSlots[i];
			var name = targetSlot.getAttribute('name');
			var sourceSlot = source.querySelector('[slot="'+ name + '"]');

			if (sourceSlot) {
				targetSlot.parentNode.replaceChild(sourceSlot, targetSlot);
			} else {
				targetSlot.parentNode.removeChild(targetSlot);
			}

		}

		var defaultSlot = target.querySelector('slot:not([name])');

		if (defaultSlot) {

			if (source.children.length) {
				defaultSlot.parentNode.setAttribute('slot', 'default');

				while (source.firstChild) {
					defaultSlot.parentNode.insertBefore(source.firstChild, defaultSlot);
				}

			}

			defaultSlot.parentNode.removeChild(defaultSlot);
		}

	}

	// renderTemplate (template) {
	// 	var fragment = document.createDocumentFragment();
	//
	// 	if (template) {
	//
	// 		if (typeof template === 'string') {
	// 			var temporary = document.createElement('div');
	//
	// 			temporary.innerHTML = template;
	//
	// 			while (temporary.firstChild) {
	// 				fragment.appendChild(temporary.firstChild);
	// 			}
	//
	// 		} else {
	// 			fragment.appendChild(template);
	// 		}
	//
	// 	}
	//
	// 	return fragment;
	// }

	renderStyle (style, scope) {

		if (!style) return '';

		if (window.CSS && window.CSS.supports) {

			if (!window.CSS.supports('(--t: black)')) {
				var matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

				for (var i = 0, l = matches.length; i < l; i++) {
					var match = matches[i];
					var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
					var pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
					style = style.replace(rule[0], '');
					style = style.replace(pattern, rule[2]);
				}

			}

			if (!window.CSS.supports(':scope')) {
				style = style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
			}

			if (!window.CSS.supports(':host')) {
				style = style.replace(/\:host/g, '[o-scope="' + scope + '"]');
			}

		}

		return '<style>' + style + '</style>';
	}

	created (element, options) {
		var self = this;
		var scope = options.name + '-' + options.count++;

		Object.defineProperties(element, {
			scope: {
				value: scope,
				enumerable: true
			}
		});

		element.setAttribute('o-scope', scope);
		// element.setAttribute('o-status', 'created');

		Model.set(scope, options.model);
		Methods.set(scope, options.methods);

		if (self.compiled && element.parentElement.nodeName === 'O-ROUTER') {
			Binder.bind(element, element, scope);
		} else {
			var template = document.createElement('template');
			var style = self.renderStyle(options.style, scope);

			if (typeof options.template === 'string') {
				template.innerHTML = style + options.template;
			} else {
				template.innerHTML = style;
				template.appendChild(options.template);
			}

			// element.templateContent = template.content;
			var clone = document.importNode(template.content, true);
			// Binder.bind(clone.querySelectorAll('*'), element, scope);
			Binder.bind(clone, element, scope);

			if (options.shadow) {
				if ('attachShadow' in document.body) {
					element.attachShadow({ mode: 'open' }).appendChild(clone);
				} else if ('createShadowRoot' in document.body) {
					element.createShadowRoot().appendChild(clone);
				}
			} else {
				self.renderSlot(clone, element);
				element.appendChild(clone);
			}
		}

		if (options.created) {
			options.created.call(element);
		}

	}

	attached (element, options) {
		if (options.attached) {
			options.attached.call(element);
		}
	}

	detached (element, options) {
		if (options.detached) {
			options.detached.call(element);
		}
	}

	define (options) {
		var self = this;

		if (!options.name) {
			throw new Error('Oxe.component.define - requires name');
		}

		if (options.name in self.data) {
			throw new Error('Oxe.component.define - component defined');
		}

		self.data[options.name] = options;

		options.count = 0;
		options.compiled = false;
		options.style = options.style || '';
		options.model = options.model || {};
		options.methods = options.methods || {};
		options.shadow = options.shadow || false;
		options.template = options.template || '';
		options.properties = options.properties || {};

		options.properties.model = {
			enumerable: true,
			// might not want configurable
			configurable: true,
			get: function () {
				return Model.get(this.scope);
			},
			set: function (data) {
				data = data && typeof data === 'object' ? data : {};
				return Model.set(this.scope, data);
			}
		};

		options.properties.methods = {
			enumerable: true,
			get: function () {
				return Methods.get(this.scope);
			}
		};

		options.proto = Object.create(HTMLElement.prototype, options.properties);

		options.proto.attributeChangedCallback = options.attributed;

		options.proto.createdCallback = function () {
			self.created(this, options);
		};

		options.proto.attachedCallback = function () {
			self.attached(this, options);
		};

		options.proto.detachedCallback = function () {
			self.detached(this, options);
		};

		return document.registerElement(options.name, {
			prototype: options.proto
		});

	}

}

export default new Component();
