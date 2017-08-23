import Utility from '../utility';

export default function Binder (options) {
	this.element = options.element;
	this.attribute = options.attribute;
	// this.view = options.controller.view;
	this.controller = options.controller;
	// this.model = options.controller.model;
	// this.events = options.controller.events;
	this.renderType = this.attribute.cmds[0] || 'default';

	if (this.renderType === 'on') {
		this.data = Utility.getByPath(this.controller.events, this.attribute.path).bind(this.controller.model.data);
	} else {
		this.modifiers = this.attribute.modifiers.map(function (modifier) {
			return this.controller.modifiers[modifier];
		}, this);

		this.paths = this.attribute.path.split('.');
		this.key = this.paths.slice(-1)[0];
		this.path = this.paths.slice(0, -1).join('.');
		this.data = this.path ? Utility.getByPath(this.controller.model.data, this.path) : this.controller.model.data;
	}

	this.render();
}

Binder.prototype.setData = function (data) {
	if (!this.data) return;

	if (data !== undefined) {
		for (var i = 0, l = this.modifiers.length; i < l; i++) {
			data = this.modifiers[i].call(data);
		}
	}

	return this.data[this.key] = data;
};

Binder.prototype.getData = function () {
	if (!this.data) return;

	var data = this.data[this.key];

	if (data !== undefined) {
		for (var i = 0, l = this.modifiers.length; i < l; i++) {
			data = this.modifiers[i].call(data);
		}
	}

	return data;
};

Binder.prototype.updateModel = function () {
	if (this.element.type === 'checkbox') {
		this.setData(this.element.value = this.element.checked);
	} if (this.element.nodeName === 'SELECT' && this.element.multiple) {
		this.setData(Array.prototype.filter.call(this.element.options, function (option) {
			return option.selected;
		}).map(function (option) {
			return option.value;
		}));
	} else if (this.element.type === 'radio') {
		var elements = this.element.parentNode.querySelectorAll('input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]');
		for (var i = 0, l = elements.length, radio; i < l; i++) {
			radio = elements[i];
			if (radio === this.element) {
				this.setData(i);
			} else {
				radio.checked = false;
			}
		}
	} else {
		this.setData(this.element.value);
	}
};

Binder.prototype.renderMethods = {
	on: function (data) {
		var self = this;
		self.element.removeEventListener(self.attribute.cmds[1], data);
		self.element.addEventListener(self.attribute.cmds[1], data);
	},
	each: function (data) {
		var self = this;

		if (!self.clone) {
			self.variable = self.attribute.cmds.slice(1).join('.');
			self.clone = self.element.removeChild(self.element.children[0]).outerHTML;
			self.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + self.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
		}

		if (self.element.children.length > data.length) {
			self.element.removeChild(self.element.children[self.element.children.length-1]);
		} else if (self.element.children.length < data.length) {
			self.element.insertAdjacentHTML(
				'beforeend',
				self.clone.replace(
					self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
				)
			);
		}
	},
	value: function (data) {
		// NOTE triggered on every change
		if (this.isSetup) return;
		var self = this, i, l;

		if (self.element.type === 'checkbox') {
			if (self.element.checked !== data) {
				self.element.value = self.element.checked = data;
			}
		} if (self.element.nodeName === 'SELECT' && self.element.multiple) {
			if (self.element.options.length !== data.length) {
				var options = self.element.options;
				for (i = 0, l = options.length; i < l; i++) {
					var option = options[i];
					if (option.value === data[i]) {
						option.selected;
					}
				}
			}
		} else if (self.element.type === 'radio') {
			var elements = self.element.parentNode.querySelectorAll('input[type="radio"][type="radio"][j-value="' + self.attribute.value + '"]');
			for (i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				radio.checked = i === data;
			}
		} else {
			self.element.value = data;
		}

		self.isSetup = true;
	},
	html: function (data) {
		var self = this;
		// FIXME not rendering j-*
		self.element.innerHTML = data;
	},
	css: function (data) {
		var css = data;

		if (this.attribute.cmds.length > 1) {
			css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
		}

		this.element.style.cssText += css;
	},
	class: function (data) {
		var className = this.attribute.cmds.slice(1).join('-');
		this.element.classList.toggle(className, data);
	},
	text: function (data) {
		this.element.innerText = data;
	},
	enable: function (data) {
		this.element.disabled = !data;
	},
	disable: function (data) {
		this.element.disabled = data;
	},
	show: function (data) {
		this.element.hidden = !data;
	},
	hide: function (data) {
		this.element.hidden = data;
	},
	write: function (data) {
		this.element.readOnly = !data;
	},
	read: function (data) {
		this.element.readOnly = data;
	},
	selected: function (data) {
		this.element.selectedIndex = data;
	},
	default: function (data) {
		var path = Utility.toCamelCase(this.attribute.cmds);
		Utility.setByPath(this.element, path, data);
	}
};

Binder.prototype.unrenderMethods = {
	on: function (data) {
		this.element.removeEventListener(this.attribute.cmds[1], data, false);
	},
	each: function () {
		while (this.element.lastChild) {
			this.element.removeChild(this.element.lastChild);
		}
	},
	html: function () {
		this.element.innerText = '';
	},
	text: function () {
		this.element.innerText = '';
	},
	default: function () {

	}
};

Binder.prototype.unrender = function () {
	var self = this;
	var data = self.renderType === 'on' ? self.data : undefined;
	self.unrenderMethods[self.renderType].call(self, data);
	return self;
};

Binder.prototype.render = function () {
	var self = this;
	var data = self.renderType === 'on' ? self.data : self.getData();
	if (data === undefined) return;
	self.renderMethods[self.renderType].call(self, data);
	return self;
};
