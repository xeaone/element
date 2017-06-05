var Binder = require('../binder');
var Uuid = require('../uuid');

function Component (options) {
	var self = this;

	if (!options) throw new Error('Component missing options');
	if (!options.name) throw new Error('Component missing options.name');
	if (!options.template) throw new Error('Component missing options.template');

	self.name = options.name;
	self.model = options.model;
	self.modifiers = options.modifiers;
	self.currentScript = (document._currentScript || document.currentScript);
	self.template = self._template(options.template);

	self.elementPrototype = Object.create(HTMLElement.prototype);

	self.elementPrototype.attachedCallback = options.attached;
	self.elementPrototype.detachedCallback = options.detached;
	self.elementPrototype.attributeChangedCallback = options.attributed;

	self.elementPrototype.createdCallback = function () {
		var elementInstance = this;

		elementInstance.uuid = Uuid();
		elementInstance.appendChild(document.importNode(self.template.content, true));

		if (self.model) {

			elementInstance.binder = new Binder({
				view: elementInstance,
				name: elementInstance.uuid,
				model: self.model,
				modifiers: self.modifiers
			}, function () {
				var binderInstance = this;
				elementInstance.model = binderInstance.model.data;
				elementInstance.view = binderInstance.view.data;
				if (options.created) options.created.call(elementInstance);
			});

		} else if (options.created) {
			options.created.call(elementInstance);
		}

	};

	self._define();

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

Component.prototype._define = function () {
	document.registerElement(this.name, {
		prototype: this.elementPrototype
	});
};

module.exports = Component;
