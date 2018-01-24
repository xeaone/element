import Global from './global';

// TODO want to handle default slot
// FIXME issue with the recreating elements

var Component = function () {
	this.data = {};
};

Component.prototype.renderSlot = function (element, component) {
	var slots = component.fragment.querySelectorAll('slot');
	for (var i = 0, l = slots.length; i < l; i++) {
		var name = slots[i].getAttribute('name');
		var slot = element.querySelector('[slot="'+ name + '"]');
		if (slot) slots[i].parentElement.replaceChild(slot, slots[i]);
	}
};

Component.prototype.renderStyle = function (element, component, callback) {
	var self = this;

	if (!component.style || component.styleReady) {
		return callback ? callback() : undefined;
	}

	if (typeof component.style === 'function') {
		return component.style(function (s) {
			component.style = s;
			self.renderStyle(element, component, callback);
		});
	}

	if (typeof component.style === 'string') {
		var style = component.style;

		if (!window.CSS || !window.CSS.supports) {

			if (!window.CSS.supports('(--t: black)')) {
				var matches = data.match(/--\w+(?:-+\w+)*:\s*.*?;/g);
				matches.forEach(function (match) {
					var rule = match.match(/(--\w+(?:-+\w+)*):\s*(.*?);/);
					var pattern = new RegExp('var\\('+rule[1]+'\\)', 'g');
					style = style.replace(rule[0], '');
					style = style.replace(pattern, rule[2]);
				});
			}

			if (!window.CSS.supports(':scope')) {
				style = style.replace(/\:scope/g, '[o-scope="' + element.scope + '"]');
			}

		}

		var estyle = document.createElement('style');
		var nstyle = document.createTextNode(style);
		estyle.appendChild(nstyle);
		component.fragment.appendChild(estyle);
	} else if (typeof component.style === 'object') {
		component.fragment.appendChild(component.style);
	}

	component.styleReady = true;

	return callback ? callback() : undefined;
};

Component.prototype.renderTemplate = function (element, component, callback) {
	var self = this;

	console.log(element.scope);
	console.log(!component.template || component.templateReady);
	console.log('\n');

	if (!component.template || component.templateReady) {
		return callback ? callback() : undefined;
	}

	if (typeof component.template === 'function') {
		return component.template(function (t) {
			component.template = t;
			self.renderTemplate(element, component, callback);
		});
	}

	if (typeof component.template === 'string') {
		var template = document.createElement('div');
		template.innerHTML = component.template;
		while (template.firstChild) {
			component.fragment.appendChild(template.firstChild);
		}
	} else if (typeof component.template === 'object') {
		component.fragment.appendChild(component.template);
	}

	component.templateReady = true;

	return callback ? callback() : undefined;
};

Component.prototype.created = function (element, component) {
	var self = this;
	var scope = component.name + '-' + component.count++;

	Object.defineProperty(element, 'scope', {
		enumerable: true,
		value: scope
	});

	element.setAttribute('o-scope', scope);
	Global.model.set(scope, component.model || {});
	Global.methods.data[scope] = component.methods;

	self.renderStyle(element, component, function () {
		self.renderTemplate(element, component, function () {

			if (component.shadow && 'attachShadow' in document.body) {
				element.attachShadow({ mode: 'open' }).appendChild(component.fragment.cloneNode(true));
			} else if (component.shadow && 'createShadowRoot' in document.body) {
				element.createShadowRoot().appendChild(component.fragment.cloneNode(true));
			} else {
				// self.renderSlot(element, component);
				// while (element.firstChild) element.removeChild(element.firstChild);
				element.appendChild(component.fragment.cloneNode(true));
			}

			if (component.created) {
				component.created.call(element);
			}

		});
	});

};

Component.prototype.define = function (options) {
	var self = this;

	if (!options.name) {
		throw new Error('Oxe.component.define - Requires name');
	}

	if (options.name in self.data) {
		throw new Error('Oxe.component.define - Component already defined');
	}

	self.data[options.name] = options;

	options.count = 0;
	options.ready = false;
	options.model = options.model || {};
	options.shadow = options.shadow || false;
	options.template = options.template || '';
	options.properties = options.properties || {};
	options.fragment = document.createDocumentFragment();

	options.properties.scope = {
		enumerable: true,
		configurable: true
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

	document.registerElement(options.name, {
		prototype: options.proto
	});

};

export default Component;
