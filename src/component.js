import Uid from './uid';

export default function Component (options) {
	var self = this;
	options = options || {};

	if (!options.name) throw new Error('Component missing name');
	if (!options.template) throw new Error('Component missing template');

	self.name = options.name;
	self.style = options.style;


	self.global = options.global;
	self.view = options.view; // if (options.view)
	self.model = options.model; // if (options.model)
	self.events = options.events; // if (options.events)
	self.modifiers = options.modifiers; // if (options.modifiers)

	self.currentScript = (document._currentScript || document.currentScript);
	self.template = self.toTemplate(options.template);

	self.proto = Object.create(HTMLElement.prototype);
	self.proto.attachedCallback = options.attached;
	self.proto.detachedCallback = options.detached;
	self.proto.attributeChangedCallback = options.attributed;
	// self.proto.j = {};

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
		element.appendChild(document.importNode(self.template.content, true));
		if (options.created) options.created.call(element);
	};

	self.define();
}

Component.prototype.replaceSlots = function (element, template) {
	var eSlots = element.querySelectorAll('[slot]');
	for (var i = 0, l = eSlots.length; i < l; i++) {
		var eSlot = eSlots[i];
		var sName = eSlot.getAttribute('slot');
		var tSlot = template.content.querySelector('slot[name='+ sName + ']');
		tSlot.parentNode.replaceChild(eSlot, tSlot);
	}
};

Component.prototype.toHTML = function (html) {
	var template = document.createElement('template');
	template.innerHTML = html;
	return template;
};

Component.prototype.toTemplate = function (template) {
	if (template.constructor.name === 'String') {
		if (/<|>/.test(template)) {
			template = this.toHTML(template);
		} else {
			template = this.currentScript.ownerDocument.querySelector(template);
		}
	}
	return template;
};

Component.prototype.define = function () {
	document.registerElement(this.name, {
		prototype: this.proto
	});
};
