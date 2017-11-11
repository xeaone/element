import Global from './global';

var Component = {};

Component.data = {};

Component.currentScript = (document._currentScript || document.currentScript);

Component._slots = function (element, template) {
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

Component._template = function (data) {
	var template;
	if (data.html) {
		template = document.createElement('template');
		template.innerHTML = data.html;
	} else if (data.query) {
		try {
			template = Global.ownerDocument.querySelector(data.query);
		} catch (e) {
			template = document.querySelector(data.query);
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
	// else if (data.url) {
	//
	// }
	return template;
};

Component._define = function (name, proto) {
	document.registerElement(name, {
		prototype: proto
	});
};

Component.define = function (options) {
	var self = this;

	if (!options.name) {
		throw new Error('Component requires name');
	}

	if (!options.html && !options.query && !options.element) {
		throw new Error('Component requires html, query, or element');
	}

	options.template = self._template(options);
	options.proto = Object.create(HTMLElement.prototype);
	options.proto.attachedCallback = options.attached;
	options.proto.detachedCallback = options.detached;
	options.proto.attributeChangedCallback = options.attributed;

	options.proto.createdCallback = function () {
		var element = this;

		if (!(options.name in self.data)) {
			self.data[options.name] = [];
		}

		self.data[options.name].push(element);

		var uid = options.name + '-' + self.data[options.name].length;

		element.setAttribute('o-uid', uid);
		element.isBinded = false;
		element.view = Global.view.data[uid] = {};

		if (options.model) element.model = Global.model.data.$set(uid, options.model)[uid];
		if (options.events) element.events = Global.events.data[uid] = options.events;
		if (options.modifiers) element.modifiers = Global.modifiers.data[uid] = options.modifiers;

		// might want to handle default slot
		// might want to overwrite content
		self._slots(element, options.template);

		if (options.shadow) {
			element.createShadowRoot().appendChild(document.importNode(options.template.content, true));
		} else {
			element.appendChild(document.importNode(options.template.content, true));
		}

		if (options.created) {
			options.created.call(element);
		}

	};

	self._define(options.name, options.proto);
};

export default Component;
