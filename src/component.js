import Global from './global';

// TODO want to handle default slot

var Component = function () {
	this.data = {};
};

Component.prototype.handleSlots = function (element, template) {
	var tSlots = template.content.querySelectorAll('slot');

	for (var i = 0, l = tSlots.length; i < l; i++) {
		var tSlot = tSlots[i];
		var tName = tSlot.getAttribute('name');
		var eSlot = element.querySelector('[slot="'+ tName + '"]');

		if (eSlot) {
			tSlot.parentElement.replaceChild(eSlot, tSlot);
		}

	}

};

Component.prototype.render = function (data, name, callback) {

	if (this.data[name].ready) {
		return callback ? callback() : undefined;
	}

	if (typeof data === 'function') {
		return data(function (d) {
			this.render(d, name, callback);
		}.bind(this));
	}

	var template = document.createElement('template');

	if (typeof data === 'string') {
		template.innerHTML = data;
	} else if (typeof data === 'object') {
		template.content.appendChild(data);
	}

	this.data[name].ready = true;
	this.data[name].template = template;

	return callback ? callback() : undefined;
};

Component.prototype.created = function (element, component) {
	var self = this;
	// var component = self.data[element.nodeName.toLowerCase()];

	Object.defineProperty(element, 'scope', {
		enumerable: true,
		value: component.name + '-' + component.count++
	});

	element.setAttribute('o-scope', element.scope);

	Global.model.set(element.scope, component.model || {});
	Global.methods.data[element.scope] = component.methods;

	self.render(component.template, component.name, function () {

		if (component.shadow && 'attachShadow' in document.body) {
			element.attachShadow({ mode: 'open' }).appendChild(document.importNode(component.template.content, true));
		} else if (component.shadow && 'createShadowRoot' in document.body) {
			element.createShadowRoot().appendChild(document.importNode(component.template.content, true));
		} else {
			self.handleSlots(element, component.template);
			element.appendChild(document.importNode(component.template.content, true));
		}

		if (component.created) {
			component.created.call(element);
		}

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
