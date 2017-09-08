import Utility from '../utility';

export default function Binder (options) {
	var self = this;

	self.element = options.element;
	self.attribute = options.attribute;
	self.controller = options.controller;
	self.renderType = self.attribute.cmds[0] || 'default';

	if (self.renderType === 'on') {
		self.data = Utility.getByPath(self.controller.events, self.attribute.path).bind(self.controller.model.data);
	} else {
		self.modifiers = [];

		for (var i = 0, l = self.attribute.modifiers.length; i < l; i++) {
			self.modifiers[self.modifiers.length] = self.controller.modifiers[self.attribute.modifiers[i]];
		}

		self.paths = self.attribute.path.split('.');
		self.key = self.paths.slice(-1)[0];
		self.path = self.paths.slice(0, -1).join('.');
		self.data = self.path ? Utility.getByPath(self.controller.model.data, self.path) : self.controller.model.data;

		// dyncamically set observed property on model
		if (self.attribute.cmds[0] === 'value' && self.data && self.data[self.key] === undefined) {
			self.data.$set(self.key, null);
			self.updateModel();
		}

	}

	self.render();
}

Binder.prototype.setData = function (data) {
	if (this.data === undefined) return;

	if (data !== null) {
		for (var i = 0, l = this.modifiers.length; i < l; i++) {
			data = this.modifiers[i].call(this.controller.model.data, data);
			if (data === undefined) {
				throw new Error('modifier value is undefined');
			}
		}
	}

	return this.data[this.key] = data;
};

Binder.prototype.getData = function () {
	if (this.data === undefined) return;

	var data = this.data[this.key];

	if (data !== null) {
		for (var i = 0, l = this.modifiers.length; i < l; i++) {
			data = this.modifiers[i].call(this.controller.model.data, data);
			if (data === undefined) {
				throw new Error('modifier value is undefined');
			}
		}
	}

	return data;
};

Binder.prototype.updateModel = function () {
	if (this.element.type === 'checkbox') {
		this.element.value = this.element.checked;
		this.setData(this.element.checked);
	} else if (this.element.nodeName === 'SELECT' && this.element.multiple) {
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
			while (self.element.children.length > data.length) {
				self.element.removeChild(self.element.children[self.element.children.length-1]);
			}
		} else if (self.element.children.length < data.length) {
			while (self.element.children.length < data.length) {
				self.element.insertAdjacentHTML(
					'beforeend',
					self.clone.replace(
						self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
					)
				);
			}
		}
	},
	value: function (data) {
		// NOTE triggered on every change
		if (this.isSetup) return;
		var self = this, i, l;

		if (self.element.type === 'checkbox') {
			if (self.element.checked !== data) {
				self.element.value = data;
				self.element.checked = data;
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
		this.element.insertAdjacentHTML('afterbegin', data);
	},
	css: function (data) {
		if (this.attribute.cmds.length > 1) data = this.attribute.cmds.slice(1).join('-') + ': ' +  data + ';';
		this.element.style.cssText += data;
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
	href: function (data) {
		this.element.href = data;
	},
	default: function (data) {
		Utility.setByPath(this.element, Utility.toCamelCase(this.attribute.cmds), data);
	}
};

Binder.prototype.unrenderMethods = {
	on: function (data) {
		this.element.removeEventListener(this.attribute.cmds[1], data, false);
	},
	each: function () {
		while (this.element.lastChild) this.element.removeChild(this.element.lastChild);
	},
	html: function () {
		while (this.element.lastChild) this.element.removeChild(this.element.lastChild);
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
