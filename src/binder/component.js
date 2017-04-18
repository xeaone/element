var Utility = require('./utility');

function Component (element, controller) {
	this.isChangeEventAdded = false;
	this.controller = controller;
	this.isChanging = false;
	this.element = element;
	this.listeners = {};
	this.clone;
}

Component.prototype.on = function (data) {
	if (typeof data.value !== 'function') return;

	var self = this;
	var eventName = data.cmds[1];
	var methodName = data.opts[data.opts.length-1];

	self.element.removeEventListener(eventName, self.listeners[methodName], false);

	self.listeners[methodName] = function (e) {
		e.preventDefault();
		data.value.call(self.controller.model, e);
	};

	self.element.addEventListener(eventName, self.listeners[methodName], false);
};

Component.prototype.each = function (data) {
	var self = this;

	if (!self.clone) self.clone = self.element.children[0];

	var variable = data.cmds.slice(1);
	var child = self.clone.cloneNode(true);
	var inner = '';

	child = child.outerHTML;
	variable = Utility.toCamelCase(variable);
	variable = new RegExp('="'+ variable, 'g');

	for (var i = 0, l = data.value.length; i < l; i++) {
		inner += child.replace(variable, '="' + data.attribute.value + '.' + i.toString());
	}

	self.element.innerHTML = inner;
	self.controller.insert(self.element.getElementsByTagName('*'));
};

Component.prototype.value = function (data) {
	var self = this;

	if (self.element.type === 'checkbox' || self.element.type === 'radio') {
		data.value = self.modifiers(data.attribute.value, data.value);
		self.element.value = data.value;
		self.element.checked = data.value;
	}

	if (self.isChangeEventAdded) return;
	else self.isChangeEventAdded = true;

	var change = function (e) {
		if (self.isChanging) return;
		else self.isChanging = true;

		var element = e.target;
		var value = element.type === 'checkbox' || element.type === 'radio' ? element.checked : element.value;
		var path = element.getAttribute(self.controller.sValue);

		value = self.modifiers(path, value);
		path = path.replace(self.controller.rPath, '');

		// if (element.multiple) {
		// 	var v = Utility.getByPath(self.controller.model, path);
		// 	v.push();
		// 	value = v;
		// }

		Utility.setByPath(self.controller.model, path, value);
		self.isChanging = false;
	};

	self.element.addEventListener('change', change);
	self.element.addEventListener('keyup', change);
};

Component.prototype.html = function (data) {
	this.element.innerHTML = data.value;
	this.controller.insert(this.element.getElementsByTagName('*'));
};

Component.prototype.css = function (data) {
	if (data.cmds.length > 1) data.value = data.cmds.slice(1).join('-') + ': ' +  data.value + ';';
	this.element.style.cssText += data.value;
};

Component.prototype.class = function (data) {
	var className = data.cmds.slice(1).join('-');
	this.element.classList.toggle(className, data.value);
};

Component.prototype.enable = function (data) {
	this.element.disabled = !data.value;
};

Component.prototype.disable = function (data) {
	this.element.disabled = data.value;
};

Component.prototype.show = function (data) {
	this.element.hidden = !data.value;
};

Component.prototype.hide = function (data) {
	this.element.hidden = data.value;
};

Component.prototype.write = function (data) {
	this.element.readOnly = !data.value;
};

Component.prototype.read = function (data) {
	this.element.readOnly = data.value;
};

Component.prototype.selected = function (data) {
	this.element.selectedIndex = data.value;
};

Component.prototype.text = function (data) {
	this.element.innerText = data.value;
};

Component.prototype.default = function (data) {
	var path = Utility.toCamelCase(data.cmds);
	Utility.setByPath(this.element, path, data.value);
};

Component.prototype.modifiers = function (string, value) {
	if (string.indexOf('|') === -1) return value;

	var self = this;
	var modifiers = string.replace(self.controller.rModifier, '').split(' ');

	for (var i = 0, l = modifiers.length; i < l; i++) {
		if (modifiers[i] in self.controller.modifiers) {
			value = self.controller.modifiers[modifiers[i]].call(value);
		}
	}

	return value;
};

Component.prototype.render = function (attribute) {
	var self = this, data = { attribute: attribute };

	data.attribute.value = data.attribute.value.trim();
	data.path = data.attribute.value.replace(self.controller.rPath, '');
	data.command = data.attribute.name.replace(self.controller.rPrefix, '');

	data.opts = data.path.split('.');
	data.cmds = data.command.split('-');

	data.value = Utility.getByPath(self.controller.model, data.path);
	data.value = self.modifiers(data.attribute.value, data.value);

	if (data.value === null || data.value === undefined) return;
	else if (data.cmds[0] in self) self[data.cmds[0]](data);
	else self.default(data);
};

Component.prototype.eachAttribute = function (pattern, callback) {
	var attributes = this.element.attributes;
	var index = 0, length = attributes.length, attribute;

	if (typeof pattern === 'string') pattern = new RegExp(pattern);

	for (index; index < length; index++) {
		attribute = {
			name: attributes[index].name,
			value: attributes[index].value,
			full: attributes[index].name + '="' + attributes[index].value + '"'
		};

		if (pattern && pattern.test(attribute.full)) {
			callback(attribute, index);
		}
	}
};

module.exports = Component;
