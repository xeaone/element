import Global from './global';

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

Component.prototype.handleTemplate = function (data) {
	var template;

	if (data.html) {
		template = document.createElement('template');
		template.innerHTML = data.html;
	} else if (data.query) {

		try {
			template = Global.ownerDocument.querySelector(data.query);
		} catch (e) {
			template = Global.document.querySelector(data.query);
		}

		if (template.nodeType !== 'TEMPLATE') {
			template = document.createElement('template');
			template.content.appendChild(data.element);
		}

	} else if (data.element) {

		if (data.element.nodeType === 'TEMPLATE') {
			template = data.element;
		} else {
			template = document.createElement('template');
			template.content.appendChild(data.element);
		}

	}

	return template;
};

Component.prototype.define = function (options) {
	var self = this;

	if (!options.name) {
		throw new Error('Oxe.component.define - Requires name');
	}

	if (!options.html && !options.query && !options.element) {
		throw new Error('Oxe.component.define - Requires html, query, or element');
	}

	if (options.name in self.data) {
		throw new Error('Oxe.component.define - Component already defined');
	}

	if (!(options.name in self.data)) {
		self.data[options.name] = 0;
		// self.data[options.name] = [];
	}

	// options.view = options.view || {};
	options.model = options.model || {};
	options.shadow = options.shadow || false;
	options.template = self.handleTemplate(options);

	options.properties = options.properties || {};

	options.properties.model = {
		enumerable: true,
		configurable: true,
		get: function () {
			return Global.model.data.$get(this.uid);
		},
		set: function (data) {
			data = data && typeof data === 'object' ? data : {};
			return Global.model.data.$set(this.uid, data);
		}
	};

	options.properties.events = {
		enumerable: true,
		get: function () {
			var uid = this.uid;
			return Global.events.data[uid];
		}
	};

	options.properties.modifiers = {
		enumerable: true,
		get: function () {
			var uid = this.uid;
			return Global.modifiers.data[uid];
		}
	};

	options.proto = Object.create(HTMLElement.prototype, options.properties);

	options.proto.attachedCallback = options.attached;
	options.proto.detachedCallback = options.detached;
	options.proto.attributeChangedCallback = options.attributed;

	options.proto.createdCallback = function () {
		var element = this;

		Object.defineProperty(element, 'uid', {
			enumerable: true,
			configurable: true,
			value: options.name + '-' + self.data[options.name]++
		});

		element.setAttribute('o-uid', element.uid);

		Global.model.data.$set(element.uid, options.model || {});
		Global.events.data[element.uid] = options.events;
		Global.modifiers.data[element.uid] = options.modifiers;

		if (options.shadow) {
			// element.createShadowRoot().appendChild(document.importNode(options.template.content, true));
			element.attachShadow({ mode: 'open' }).appendChild(document.importNode(options.template.content, true));
		} else {
			// might want to handle default slot
			// might want to overwrite content
			self.handleSlots(element, options.template);
			element.appendChild(document.importNode(options.template.content, true));
		}

		if (options.created) {
			options.created.call(element);
		}

	};

	document.registerElement(options.name, {
		prototype: options.proto
	});
};

export default Component;
