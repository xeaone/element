import Methods from './methods.js';
import Loader from './loader.js';
import Model from './model.js';
import View from './view.js';
import Style from './style.js';

export default {

	data: {},
	compiled: false,

	async setup (options) {
		const self = this;

		options = options || {};

		if (options.components) {

			for (let i = 0, l = options.components.length; i < l; i++) {
				const component = options.components[i];

				if (typeof component === 'string') {
					const load = await Loader.load(component);
					component = load.default;
				}

				self.define(component);
			}

		}

	},

	slot (target, source, scope) {
		const targetSlots = target.querySelectorAll('slot[name]');
		const defaultSlot = target.querySelector('slot:not([name])');

		for (let i = 0, l = targetSlots.length; i < l; i++) {

			const targetSlot = targetSlots[i];
			const name = targetSlot.getAttribute('name');
			const sourceSlot = source.querySelector('[slot="'+ name + '"]');

			if (sourceSlot) {
				targetSlot.parentNode.replaceChild(sourceSlot, targetSlot);
			} else {
				targetSlot.parentNode.removeChild(targetSlot);
			}

		}

		if (defaultSlot) {

			if (source.children.length) {
				// defaultSlot.parentNode.setAttribute('slot', 'default');

				while (source.firstChild) {
					defaultSlot.parentNode.insertBefore(source.firstChild, defaultSlot);
				}

			}

			defaultSlot.parentNode.removeChild(defaultSlot);
		}

	},

	fragment (template, container) {
		const fragment = document.createDocumentFragment();
		const parser = document.createElement('div');

		parser.innerHTML = template;

		while (parser.firstElementChild) {
			View.add(parser.firstElementChild, {
				container: container,
				scope: container.scope
			});
			fragment.appendChild(parser.firstElementChild);
		}

		return fragment;
	},

	style (style, scope) {

		if (!style) return '';

		if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--t: black)')) {
			let matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

			for (let i = 0, l = matches.length; i < l; i++) {
				let match = matches[i];
				let rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
				let pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
				style = style.replace(rule[0], '');
				style = style.replace(pattern, rule[2]);
			}

		}

		if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':scope')) {
			style = style.replace(/\:scope/g, '[o-scope="' + scope + '"]');
		}

		if (!window.CSS || !window.CSS.supports || !window.CSS.supports(':host')) {
			style = style.replace(/\:host/g, '[o-scope="' + scope + '"]');
		}

		Style.append(style);
	},

	render (element, options) {

		element.setAttribute('o-scope', element.scope);

		if (this.compiled && element.parentElement.nodeName === 'O-ROUTER') {
			return;
		}

		this.style(options.style, element.scope);
		const fragment = this.fragment(options.template, element);

		// const template = document.createElement('template');
		// const clone = document.importNode(fragment, true);
		// this.binds(clone.children, element);

		if (options.shadow) {
			if ('attachShadow' in document.body) {
				element.attachShadow({ mode: 'open' }).appendChild(fragment);
			} else if ('createShadowRoot' in document.body) {
				element.createShadowRoot().appendChild(fragment);
			}
		} else {
			this.slot(fragment, element);
			element.appendChild(fragment);
		}

	},

	define (options) {
		const self = this;

		if (!options.name) throw new Error('Oxe.component.define - requires name');
		if (options.name in self.data) throw new Error('Oxe.component.define - component previously defined');

		self.data[options.name] = options;

		options.count = 0;
		options.style = options.style || '';
		options.model = options.model || {};
		options.methods = options.methods || {};
		options.shadow = options.shadow || false;
		options.template = options.template || '';
		options.properties = options.properties || {};
		options.attributes = options.attributes || [];

		options.construct = function () {
			const instance = window.Reflect.construct(HTMLElement, [], this.constructor);

			options.properties.created = {
				value: false,
				enumerable: true,
				configurable: true
			};

			options.properties.scope = {
				enumerable: true,
				value: options.name + '-' + options.count++
			};

			options.properties.model = {
				enumerable: true,
				get: function () {
					return Model.get(this.scope);
				},
				set: function (data) {
					return Model.set(this.scope, data && typeof data === 'object' ? data : {});
				}
			};

			options.properties.methods = {
				enumerable: true,
				get: function () {
					return Methods.get(this.scope);
				}
			};

			Object.defineProperties(instance, options.properties);
			Model.set(instance.scope, options.model);
			Methods.set(instance.scope, options.methods);

			return instance;
		};

		options.construct.observedAttributes = options.attributes;

		options.construct.prototype.attributeChangedCallback = function () {
			if (options.attributed) options.attributed.apply(this, arguments);
		};

		options.construct.prototype.adoptedCallback = function () {
			if (options.adopted) options.adopted.call(this);
		};

		options.construct.prototype.connectedCallback = function () {

			if (!this.created) {

				self.render(this, options);

				Object.defineProperty(this, 'created', {
					value: true,
					enumerable: true,
					configurable: false
				});

				if (options.created) {
					options.created.call(this);
				}

			}

			if (options.attached) {
				options.attached.call(this);
			}
		};

		options.construct.prototype.disconnectedCallback = function () {
			if (options.detached) {
				options.detached.call(this);
			}
		};

		Object.setPrototypeOf(options.construct.prototype, HTMLElement.prototype);
		Object.setPrototypeOf(options.construct, HTMLElement);

		window.customElements.define(options.name, options.construct);
	}

};
