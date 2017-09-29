import Uid from './uid';

export default function Component (options) {
	this.currentScript = (document._currentScript || document.currentScript);
	this.setup(options);
}

Component.prototype.setup = function (options) {
	options = options || {};
	this.view = options.view;
	this.model = options.model;
	this.events = options.events;
	this.modifiers = options.modifiers;
};

Component.prototype._slots = function (element, html) {
	var eSlots = element.querySelectorAll('[slot]');
	for (var i = 0, l = eSlots.length; i < l; i++) {
		var eSlot = eSlots[i];
		var sName = eSlot.getAttribute('slot');
		var tSlot = html.content.querySelector('slot[name='+ sName + ']');
		tSlot.parentNode.replaceChild(eSlot, tSlot);
	}
};

Component.prototype._template = function (data) {
	var template;
	if (data.html) {
		template = document.createElement('template');
		template.innerHTML = data.html;
	} else if (data.query) {
		template = self.currentScript.ownerDocument.querySelector(data.query);
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

Component.prototype._define = function (name, proto) {
	document.registerElement(name, {
		prototype: proto
	});
};

Component.prototype.define = function (options) {
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

		element.uid = Uid();
		element.isBinded = false;
		element.view = self.view.data[element.uid] = {};

		if (options.model) element.model = self.model.data.$set(element.uid, options.model)[element.uid];
		if (options.events) element.events = self.events.data[element.uid] = options.events;
		if (options.modifiers) element.modifiers = self.modifiers.data[element.uid] = options.modifiers;

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
