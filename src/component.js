import Global from './global.js';

export default class Component {

	constructor () {
		this.data = {};
	}

	renderSlot (target, source) {
		var slots = target.querySelectorAll('slot[name]');

		for (var i = 0, l = slots.length; i < l; i++) {

			var name = slots[i].getAttribute('name');
			var slot = source.querySelector('[slot="'+ name + '"]');

			if (slot) {
				slots[i].parentNode.replaceChild(slot, slots[i]);
			}

		}

		var defaultSlot = target.querySelector('slot:not([name])');

		if (defaultSlot && source.children.length) {

			while (source.firstChild) {
				defaultSlot.insertBefore(source.firstChild);
			}

			defaultSlot.parentNode.removeChild(defaultSlot);

		}

	}

	renderTemplate (template) {
		var fragment = document.createDocumentFragment();
		var temporary = document.createElement('div');

		temporary.innerHTML = template || '';

		while (temporary.firstChild) {
			fragment.appendChild(temporary.firstChild);
		}

		return fragment;
	}

	renderStyle (style, scope) {

		if (!style) return;

		if (window.CSS && window.CSS.supports) {

			if (!window.CSS.supports('(--t: black)')) {
				var matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

				matches.forEach(function (match) {

					var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
					var pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');

					style = style.replace(rule[0], '');
					style = style.replace(pattern, rule[2]);

				});

			}

			if (!window.CSS.supports(':scope')) {
				style = style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
			}

			if (!window.CSS.supports(':host')) {
				style = style.replace(/\:host/g, '[o-scope="' + scope + '"]');
			}

		}

		var estyle = document.createElement('style');
		var nstyle = document.createTextNode(style);

		estyle.appendChild(nstyle);

		return estyle;
	}

	created (element, options) {
		var self = this;
		var scope = options.name + '-' + options.count++;

		Object.defineProperties(element, {
			scope: {
				enumerable: true,
				value: scope
			},
			status: {
				enumerable: true,
				value: 'created'
			}
		});

		element.setAttribute('o-scope', scope);

		Global.model.set(scope, options.model || {});
		Global.methods.data[scope] = options.methods;

		if (element.parentNode.nodeName !== 'O-ROUTER' && self.compiled) {

			var eTemplate = self.renderTemplate(options.template);
			var eStyle = self.renderStyle(options.style, scope);

			if (eStyle) {
				eTemplate.insertBefore(eStyle, eTemplate.firstChild);
			}

			if (options.shadow && 'attachShadow' in document.body) {
				element.attachShadow({ mode: 'open' }).appendChild(eTemplate);
			} else if (options.shadow && 'createShadowRoot' in document.body) {
				element.createShadowRoot().appendChild(eTemplate);
			} else {
				self.renderSlot(eTemplate, element);
				element.appendChild(eTemplate);
			}

		}

		Global.view.add(element);

		if (options.created) {
			options.created.call(element);
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
		options.model = options.model || {};
		options.shadow = options.shadow || false;
		options.template = options.template || '';
		options.properties = options.properties || {};

		options.properties.scope = {
			enumerable: true,
			configurable: true
		};

		options.properties.status = {
			enumerable: true,
			configurable: true,
			value: 'define'
		};

		options.properties.model = {
			enumerable: true,
			configurable: true,
			get: function () {
				return Global.model.get(this.scope);
			},
			set: function (data) {
				data = data && typeof data === 'object' ? data : {};
				return Global.model.set(this.scope, data);
			}
		};

		options.properties.methods = {
			enumerable: true,
			get: function () {
				return Global.methods.data[this.scope];
			}
		};

		options.proto = Object.create(HTMLElement.prototype, options.properties);

		options.proto.attachedCallback = options.attached;
		options.proto.detachedCallback = options.detached;
		options.proto.attributeChangedCallback = options.attributed;

		options.proto.createdCallback = function () {
			self.created(this, options);
		};

		return document.registerElement(options.name, {
			prototype: options.proto
		});

	}

}
