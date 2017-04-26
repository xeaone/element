var Utility = require('./utility');

function Unit () {}

Unit.prototype.attributes = {
	on: function () {
		var self = this;

		if (typeof self.value !== 'function') return;

		var eventName = self.attribute.cmds[1];
		var methodName = self.attribute.opts[self.attribute.opts.length-1];

		self.element.removeEventListener(eventName, self.listeners[methodName], false);

		self.listeners[methodName] = function (e) {
			e.preventDefault();
			self.value.call(self, e);
		};

		self.element.addEventListener(eventName, self.listeners[methodName], false);
	},
	each: function () {
		var self = this;

		if (!self.clone) self.clone = self.element.children[0];

		var variable = self.attribute.cmds.slice(1);
		var child = self.clone.cloneNode(true);
		var inner = '';

		child = child.outerHTML;
		variable = Utility.toCamelCase(variable);
		variable = new RegExp('="'+ variable, 'g');

		for (var i = 0, l = self.value.length; i < l; i++) {
			inner += child.replace(variable, '="' + self.attribute.value + '.' + i.toString());
		}

		self.element.innerHTML = inner;

		var view = self.controller.createView(self.element.getElementsByTagName('*'));

		for (var path in view) {
			self.view[path].render();
			self.controller.view[path].concat(self.view[path]);
		}

	},
	value: function () {
		var self = this;

		if (self.element.type === 'checkbox' || self.element.type === 'radio') {
			self.element.value = self.value;
			self.element.checked = self.value;
		}

		if (self.isChangeEventAdded) return;
		else self.isChangeEventAdded = true;

		var change = function (e) {
			if (self.isChanging) return;
			else self.isChanging = true;

			var element = e.target;
			var value = element.type === 'checkbox' || element.type === 'radio' ? element.checked : element.value;

			Utility.setByPath(self.controller.model, self.attribute.opts[0], value);
			self.isChanging = false;
		};

		self.element.addEventListener('change', change);
		self.element.addEventListener('keyup', change);
	},
	html: function () {
		this.element.innerHTML = this.value;
		this.controller.insert(this.element.getElementsByTagName('*'));
	},
	css: function () {
		if (this.attribute.cmds.length > 1) this.value = this.attribute.cmds.slice(1).join('-') + ': ' +  this.value + ';';
		this.element.style.cssText += this.value;
	},
	class: function () {
		var className = this.attribute.cmds.slice(1).join('-');
		this.element.classList.toggle(className, this.value);
	},
	text: function () {
		this.element.innerText = this.value;
	},
	enable: function () {
		this.element.disabled = !this.value;
	},
	disable: function () {
		this.element.disabled = this.value;
	},
	show: function () {
		this.element.hidden = !this.value;
	},
	hide: function () {
		this.element.hidden = this.value;
	},
	write: function () {
		this.element.readOnly = !this.value;
	},
	read: function () {
		this.element.readOnly = this.value;
	},
	selected: function () {
		this.element.selectedIndex = this.value;
	},
	default: function () {
		var path = Utility.toCamelCase(this.attribute.cmds);
		Utility.setByPath(this.element, path, this.value);
	}
};

Unit.prototype.create = function (options) {
	var self = this;

	self.isChangeEventAdded = false;
	self.controller = options.controller;
	self.attribute = options.attribute;
	self.modifiers = options.modifiers;
	self.element = options.element;
	self.isChanging = false;
	self.listeners = {};
	self.clone;

	self._value = null;

	Object.defineProperty(self, 'value', {
		configurable: true,
		enumerable: true,
		get: function () {
			self.modifiers.forEach(function (modifier) {
				self._value = modifier.call(self._value);
			});

			return self._value;
		},
		set: function (value) {
			self._value = value;
		}
	});

	// if (self.value === null || self.value === undefined) return self;
	if (self.attribute.cmds[0] in self.attributes) self.render = self.attributes[self.attribute.cmds[0]];
	else self.render = self.attributes.default;

	return self;
};

module.exports = function (options) {
	return new Unit().create(options);
};
