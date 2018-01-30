import Global from './global';

var Component = function () {
	this.data = {};
};

Component.prototype.renderSlot = function (target, source) {
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

};

Component.prototype.renderTemplate = function (data, callback) {
	if (!data) {
		callback(document.createDocumentFragment());
	} else if (typeof data === 'string') {
		var fragment = document.createDocumentFragment();
		var temporary = document.createElement('div');

		temporary.innerHTML = data;

		while (temporary.firstChild) {
			fragment.appendChild(temporary.firstChild);
		}

		callback(fragment);
	} else if (typeof data === 'object') {
		callback(data);
	} else if (typeof data === 'function') {
		data(function (t) {
			this.renderTemplate(t, callback);
		}.bind(this));
	} else {
		throw new Error('Oxe.component.renderTemplate - invalid template type');
	}
};

Component.prototype.renderStyle = function (style, scope, callback) {
	if (!style) {
		callback();
	} else if (typeof style === 'string') {

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

		callback(estyle);
	} else if (typeof style === 'object') {
		callback(style);
	} else if (typeof style === 'function') {
		style(function (s) {
			this.renderStyle(s, scope, callback);
		}.bind(this));
	} else {
		throw new Error('Oxe.component.renderStyle - invalid style type');
	}
};

Component.prototype.created = function (element, options) {
	var self = this;
	var scope = options.name + '-' + options.count++;

	Object.defineProperty(element, 'scope', {
		enumerable: true,
		value: scope
	});

	element.setAttribute('o-scope', scope);

	Global.model.ready(function () {

		Global.model.set(scope, options.model || {});
		Global.methods.data[scope] = options.methods;

		self.renderTemplate(options.template, function (etemplate) {
			self.renderStyle(options.style, scope, function (estyle) {

				if (estyle) {
					etemplate.insertBefore(estyle, etemplate.firstChild);
				}

				if (options.shadow && 'attachShadow' in document.body) {
					element.attachShadow({ mode: 'open' }).appendChild(etemplate);
				} else if (options.shadow && 'createShadowRoot' in document.body) {
					element.createShadowRoot().appendChild(etemplate);
				} else {
					self.renderSlot(etemplate, element);
					element.appendChild(etemplate);
				}

				if (options.created) {
					options.created.call(element);
				}

			});
		});
	});
};

Component.prototype.define = function (options) {
	var self = this;

	if (!options.name) {
		throw new Error('Oxe.component.define - requires name');
	}

	if (options.name in self.data) {
		throw new Error('Oxe.component.define - component defined');
	}

	self.data[options.name] = options;

	options.count = 0;
	options.ready = false;
	options.model = options.model || {};
	options.shadow = options.shadow || false;
	options.template = options.template || '';
	options.properties = options.properties || {};

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

	return document.registerElement(options.name, {
		prototype: options.proto
	});

};

export default Component;
