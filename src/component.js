import Controller from './controller';
import Uuid from './uuid';

export default function Component (options) {
	var self = this;

	options = options || {};

	if (!options.name) throw new Error('Component missing options.name');
	if (!options.template) throw new Error('Component missing options.template');

	self.name = options.name;
	self.model = options.model;
	self.style = options.style;
	self.events = options.events;
	self.modifiers = options.modifiers;
	self.currentScript = (document._currentScript || document.currentScript);
	self.template = self.toTemplate(options.template);

	self.proto = Object.create(HTMLElement.prototype);

	self.proto.attachedCallback = options.attached;
	self.proto.detachedCallback = options.detached;
	self.proto.attributeChangedCallback = options.attributed;

	self.proto.createdCallback = function () {
		self.element = this;
		self.element.uuid = Uuid();

		// handle slots
		// might want to handle default slot
		// might want to overwrite content
		self.slotify();

		self.element.appendChild(
			document.importNode(self.template.content, true)
		);

		if (self.model) {
			self.element.controller = new Controller({
				model: self.model,
				view: self.element,
				events: self.events,
				name: self.element.uuid,
				modifiers: self.modifiers
			}, function () {
				var controller = this;
				self.element.view = controller.view.data;

				Object.defineProperty(self.element, 'model', {
					enumerable: true,
					configurable: true,
					set: function (data) {
						controller.model.overwrite(data);
						// TODO need to render view
					},
					get: function () {
						return controller.model.data;
					}
				});

				if (options.created) options.created.call(self.element);
			});
		} else if (options.created) {
			options.created.call(self.element);
		}

	};

	self.define();

}

Component.prototype.slotify = function () {
	var self = this;
	var eSlots = self.element.querySelectorAll('[slot]');

	for (var i = 0, l = eSlots.length; i < l; i++) {
		var eSlot = eSlots[i];
		var sName = eSlot.getAttribute('slot');
		var tSlot = self.template.content.querySelector('slot[name='+ sName + ']');
		tSlot.parentNode.replaceChild(eSlot, tSlot);
	}
};

Component.prototype.toDom = function (string) {
	var template = document.createElement('template');
	template.innerHTML = string;
	return template;
};

Component.prototype.toTemplate = function (template) {

	if (template.constructor.name === 'String') {
		if (/<|>/.test(template)) {
			template = this.toDom(template);
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
