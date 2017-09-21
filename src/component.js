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

Component.prototype.define = function (data) {
	var self = this;

	if (!data.name) throw new Error('Component requires name');
	if (!data.html && !data.query && !data.element) throw new Error('Component requires html, query, or element');

	data.proto = Object.create(HTMLElement.prototype);
	data.proto.attachedCallback = data.attached;
	data.proto.detachedCallback = data.detached;
	data.proto.attributeChangedCallback = data.attributed;
	data.template = self._template(data);

	data.proto.createdCallback = function () {
		var element = this;

		element.uid = Uid();
		element.isBinded = false;
		element.view = self.view.data[element.uid] = {};

		if (data.model) element.model = self.model.data.$set(element.uid, data.model)[element.uid];
		if (data.events) element.events = self.events.data[element.uid] = data.events;
		if (data.modifiers) element.modifiers = self.modifiers.data[element.uid] = data.modifiers;

		// might want to handle default slot
		// might want to overwrite content
		self._slots(element, data.template);

		if (data.shadow) {
			element.createShadowRoot().appendChild(document.importNode(data.template.content, true));
		} else {
			element.appendChild(document.importNode(data.template.content, true));
		}

		if (data.created) {
			data.created.call(element);
		}

	};

	self._define(data.name, data.proto);
};
