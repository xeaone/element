import Global from './global';

var Component = {};

Component.data = {};

Component.handleSlots = function (element, template) {
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

Component.handleTemplate = function (data) {
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

Component.define = function (options) {
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

	self.data[options.name] = [];

	// options.view = options.view || {};
	options.model = options.model || {};
	options.shadow = options.shadow || false;
	options.properties = options.properties || {};
	options.template = self.handleTemplate(options);

	options.properties.uid = {
		enumerable: true,
		get: function () {
			return this.getAttribute('o-uid');
		}
	};

	options.properties.model = {
		enumerable: true,
		configurable: true,
		get: function () {
			var uid = this.uid;
			return Global.model.get(uid);
		},
		set: function (data) {
			var uid = this.uid;
			data = data && data.constructor === Object ? data : {};
			Global.model.set(uid, data);
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
		var uid = options.name + '-' + self.data[options.name].length;

		element.setAttribute('o-uid', uid);

		Global.model.set(uid, options.model);
		Global.events.data[uid] = options.events;
		Global.modifiers.data[uid] = options.modifiers;

		if (options.shadow) {
			// element.createShadowRoot().appendChild(document.importNode(options.template.content, true));
			element.attachShadow({ mode: 'open' }).appendChild(document.importNode(options.template.content, true));
		} else {
			// might want to handle default slot
			// might want to overwrite content
			self.handleSlots(element, options.template);
			element.appendChild(document.importNode(options.template.content, true));
		}

		self.data[options.name].push(element);

		if (options.created) {
			options.created.call(element);
		}

	};

	document.registerElement(options.name, {
		prototype: options.proto
	});
};

export default Component;
