import Uid from './uid';

export default function Component (options) {
	var self = this;

	options = options || {};

	if (!options.name) {
		throw new Error('Component requires name');
	}

	if (!options.html && !options.query && !options.element) {
		throw new Error('Component requires html, query, or element');
	}

	self.name = options.name;
	self.view = options.view;
	self.model = options.model;
	self.style = options.style;
	self.events = options.events;
	self.global = options.global;
	self.shadow = options.shadow;
	self.modifiers = options.modifiers;
	self.currentScript = (document._currentScript || document.currentScript);

	self.template = self.createTemplate(options);

	self.proto = Object.create(HTMLElement.prototype);
	self.proto.attachedCallback = options.attached;
	self.proto.detachedCallback = options.detached;
	self.proto.attributeChangedCallback = options.attributed;

	self.proto.createdCallback = function () {
		var element = this;

		element.uid = Uid();
		element.isBinded = false;

		// add to view
		self.global.view.data[element.uid] = {};
		element.view = self.global.view.data[element.uid];

		if (self.model) element.model = self.global.model.data.$set(element.uid, self.model)[element.uid];
		if (self.events) element.events = self.global.events.data[element.uid] = self.events;
		if (self.modifiers) element.modifiers = self.global.modifiers.data[element.uid] = self.modifiers;

		// might want to handle default slot
		// might want to overwrite content
		self.replaceSlots(element, self.template);

		if (self.shadow) {
			element.createShadowRoot().appendChild(document.importNode(self.template.content, true));
		} else {
			element.appendChild(document.importNode(self.template.content, true));
		}

		if (options.created) options.created.call(element);
	};

	self.define();
}

Component.prototype.replaceSlots = function (element, html) {
	var eSlots = element.querySelectorAll('[slot]');
	for (var i = 0, l = eSlots.length; i < l; i++) {
		var eSlot = eSlots[i];
		var sName = eSlot.getAttribute('slot');
		var tSlot = html.content.querySelector('slot[name='+ sName + ']');
		tSlot.parentNode.replaceChild(eSlot, tSlot);
	}
};

Component.prototype.createTemplate = function (options) {
	var template;
	if (options.html) {
		template = document.createElement('template');
		template.innerHTML = options.html;
	} else if (options.query) {
		template = self.currentScript.ownerDocument.querySelector(options.query);
		if (template.nodeType !== 'TEMPLATE') {
			template = document.createElement('template');
			template.content.appendChild(options.element);
		}
	} else if (options.element) {
		if (options.element.nodeType === 'TEMPLATE') {
			template = options.element;
		} else {
			template = document.createElement('template');
			template.content.appendChild(options.element);
		}
	}
	// else if (options.url) {
	//
	// }
	return template;
};

Component.prototype.define = function () {
	document.registerElement(this.name, {
		prototype: this.proto
	});
};
