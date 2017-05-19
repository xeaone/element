var Binder = require('../binder');
var Uuid = require('../uuid');

function Component () {}

Component.prototype.comment = function (method) {
	if (typeof method !== 'function') throw new Error('Comment must be a function');
	var comment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;
	var match = comment.exec(method.toString());
	if (!match) throw new Error('Comment missing');
	return match[1];
};

Component.prototype.dom = function (string) {
	var temporary = document.createElement('div');
	temporary.innerHTML = string;
	return temporary.children[0];
};

Component.prototype._template = function (template) {
	if (template.constructor.name === 'Function') {
		template = this.comment(template);
		template = this.dom(template);
	} else if (template.constructor.name === 'String') {
		if (/<|>/.test(template)) {
			template = this.dom(template);
		} else {
			template = this.currentScript.ownerDocument.querySelector(template);
		}
	}

	return template;
};

Component.prototype.define = function (name, options) {
	return document.registerElement(name, {
		prototype: Object.create(HTMLElement.prototype, options)
	});
};

Component.prototype.create = function (options) {
	if (!options) throw new Error('missing options');
	if (!options.name) throw new Error('missing options.name');
	if (!options.template) throw new Error('missing options.template');

	var self = this;

	self.name = options.name;
	self.model = options.model;
	self.modifiers = options.modifiers;
	self.currentScript = (document._currentScript || document.currentScript);
	self.template = self._template(options.template);

	if (options.created) self.created = options.created.bind(self);
	if (options.attached) self.attached = options.attached.bind(self);
	if (options.detached) self.detached = options.detached.bind(self);
	if (options.attributed) self.attributed = options.attributed.bind(self);

	self.proto = self.define(self.name, {
		attachedCallback: { value: self.attached },
		detachedCallback: { value: self.detached },
		attributeChangedCallback: { value: self.attributed },
		createdCallback: {
			value: function () {
				self.element = this;
				self.uuid = Uuid();
				self.element.appendChild(document.importNode(self.template.content, true));

				if (self.model) {
					self.binder = Binder({
						name: self.uuid,
						model: self.model,
						view: self.element,
						modifiers: self.modifiers
					}, function () {
						self.model = this.model;
						if (self.created) self.created.call(self);
					});
				} else {
					if (self.created) self.created.call(self);
				}

			}
		}
	});

	return self;
};

module.exports = function (options) {
	return new Component().create(options);
};
