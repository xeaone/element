var Binder = require('../binder');
var Uuid = require('../uuid');

function Component (options) {
	if (!options) throw new Error('Component missing options');
	if (!options.name) throw new Error('Component missing options.name');
	if (!options.template) throw new Error('Component missing options.template');

	var self = this;

	self.name = options.name;
	self.model = options.model;
	self.modifiers = options.modifiers;
	self.currentScript = (document._currentScript || document.currentScript);
	self.template = self._template(options.template);

	self.created = options.created ? options.created.bind(self) : undefined;
	self.attached = options.attached ? options.attached.bind(self) : undefined;
	self.detached = options.detached ? options.detached.bind(self) : undefined;
	self.attributed = options.attributed ? options.attributed.bind(self) : undefined;

	self.proto = self._define(self.name, {
		attachedCallback: {
			value: self.attached
		},
		detachedCallback: {
			value: self.detached
		},
		attributeChangedCallback: {
			value: self.attributed
		},
		createdCallback: {
			value: function () {
				self.element = this;
				self.uuid = Uuid();
				self.element.appendChild(document.importNode(self.template.content, true));

				if (self.model) {

					self.binder = new Binder({
						name: self.uuid,
						model: self.model,
						view: self.element,
						modifiers: self.modifiers
					}, function () {
						self.model = this.model.data;
						self.view = this.view.data;

						if (self.created) {
							self.created(self);
						}

					});

				} else {

					if (self.created) {
						self.created(self);
					}

				}

			}
		}
	});

}

Component.prototype._comment = function (method) {
	if (typeof method !== 'function') throw new Error('Comment must be a function');
	var comment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;
	var match = comment.exec(method.toString());
	if (!match) throw new Error('Comment missing');
	return match[1];
};

Component.prototype._dom = function (string) {
	var temporary = document.createElement('div');
	temporary.innerHTML = string;
	return temporary.children[0];
};

Component.prototype._template = function (template) {

	if (template.constructor.name === 'Function') {

		template = this._comment(template);
		template = this._dom(template);

	} else if (template.constructor.name === 'String') {

		if (/<|>/.test(template)) {
			template = this._dom(template);
		} else {
			template = this.currentScript.ownerDocument.querySelector(template);
		}

	}

	return template;
};

Component.prototype._define = function (name, options) {
	return document.registerElement(name, {
		prototype: Object.create(HTMLElement.prototype, options)
	});
};

module.exports = Component;
