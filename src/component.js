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
			for (let i = 0, l = options.components.length; i < l; i++) {
				this.define(options.components[i]);
			}
		}

	}

	renderSlot (target, source, scope) {
		let targetSlots = target.querySelectorAll('slot[name]');

		for (let i = 0, l = targetSlots.length; i < l; i++) {
			let targetSlot = targetSlots[i];
			let name = targetSlot.getAttribute('name');
			let sourceSlot = source.querySelector('[slot="'+ name + '"]');

			if (sourceSlot) {
				targetSlot.parentNode.replaceChild(sourceSlot, targetSlot);
			} else {
				targetSlot.parentNode.removeChild(targetSlot);
			}

		}

		let defaultSlot = target.querySelector('slot:not([name])');

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
	// 	let fragment = document.createDocumentFragment();
	//
	// 	if (template) {
	//
	// 		if (typeof template === 'string') {
	// 			let temporary = document.createElement('div');
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
				let matches = style.match(/--\w+(?:-+\w+)*:\s*.*?;/g);

				for (let i = 0, l = matches.length; i < l; i++) {
					let match = matches[i];
					let rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
					let pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
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

	render (element, options) {
		let self = this;

		element.setAttribute('o-scope', self.scope);

		Model.set(self.scope, options.model);
		Methods.set(self.scope, options.methods);

		if (self.compiled && element.parentElement.nodeName === 'O-ROUTER') {

			Binder.bind(element, element, scope);

		} else {

			let template = document.createElement('template');
			let style = self.renderStyle(options.style, scope);

			if (typeof options.template === 'string') {
				template.innerHTML = style + options.template;
			} else {
				template.innerHTML = style;
				template.appendChild(options.template);
			}

			// element.templateContent = template.content;
			let clone = document.importNode(template.content, true);
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

	}

	define (options) {
		let self = this;

		if (!options.name) throw new Error('Oxe.component.define - requires name');
		if (options.name in self.data) throw new Error('Oxe.component.define - component defined');

		self.data[options.name] = options;

		options.count = 0;
		options.compiled = false;
		options.style = options.style || '';
		options.model = options.model || {};
		options.methods = options.methods || {};
		options.shadow = options.shadow || false;
		options.template = options.template || '';
		options.properties = options.properties || {};

		options.construct = function () {
			// let instance = Object.create(options.construct.prototype);
			// HTMLElement.apply(instance);

			let instance = Reflect.construct(HTMLElement, [], options.construct);

			options.properties.scope = {
				enumerable: true,
				value: options.name + '-' + options.count++
			};

			options.properties.model = {
				enumerable: true,
				// might not want configurable
				configurable: true,
				get: function () {
					console.log(this.scope);
					return Model.get(this.scope);
				},
				set: function (data) {
					console.log(this.scope);
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

			self.render(instance, options);

			if (options.created) {
				options.created.call(instance);
			}

			return instance;
		};

		options.construct.prototype.attributeChangedCallback = function () {
			if (options.attributed) options.attributed.apply(this, arguments);
		};

		options.construct.prototype.adoptedCallback = function () {
			if (options.adopted) options.adopted.call(this);
		};

		options.construct.prototype.connectedCallback = function () {
			if (options.attached) {
				options.attached.call(this);
				console.warn('Oxe.component.define - attached callback deprecated please use connected');
			}

			if (options.connected) options.connected.call(this);
		};

		options.construct.prototype.disconnectedCallback = function () {
			if (options.detached) {
				options.detached.call(this);
				console.warn('Oxe.component.define - detached callback deprecated please use disconnected');
			}

			if (options.disconnected) options.disconnected.call(this);
		};

		Object.setPrototypeOf(options.construct.prototype, HTMLElement.prototype);
		Object.setPrototypeOf(options.construct, HTMLElement);

		return window.customElements.define(options.name, options.construct);
	}

}

export default new Component();
