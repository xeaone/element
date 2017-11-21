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

Component.define = function (options) {
	var self = this;

	if (!options.name) {
		throw new Error('Oxe.component.define requires name');
	}

	if (!options.html && !options.query && !options.element) {
		throw new Error('Oxe.component.define requires html, query, or element');
	}

	options.view = options.view || {};
	options.model = options.model || {};
	options.template = self.handleTemplate(options);

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
		element.view = Global.view.data[uid] = options.view;
		element.events = Global.events.data[uid] = options.events;
		element.model = Global.model.data.$set(uid, options.model)[uid];
		element.modifiers = Global.modifiers.data[uid] = options.modifiers;

		// might want to handle default slot
		// might want to overwrite content
		self.handleSlots(element, options.template);

		if (options.shadow) {
			element.createShadowRoot().appendChild(document.importNode(options.template.content, true));
		} else {
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
