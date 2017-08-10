import Utility from '../utility';

export default function Binder (options) {
	var self = this;

	self.data = options.data;
	self.view = options.view;
	self.model = options.model;
	self.events = options.events;
	self.element = options.element;
	self.attribute = options.attribute;
	self.modifiers = options.modifiers;

	self.renderMethod = (self.renderMethods[self.attribute.cmds[0]] || self.renderMethods['default']).bind(self);
	self.unrenderMethod = (self.unrenderMethods[self.attribute.cmds[0]] || self.unrenderMethods['default']).bind(self);

	Object.defineProperty(self, 'data', {
		enumerable: true,
		configurable: true,
		get: function () {
			var data = Utility.getByPath(self.model.data, self.attribute.path);

			self.modifiers.forEach(function (modifier) {
				data = modifier.call(data);
			});

			return data;
		},
		set: function (value) {

			self.modifiers.forEach(function (modifier) {
				value = modifier.call(value);
			});

			return Utility.setByPath(self.model.data, self.attribute.path, value);
		}
	});

	self.renderMethod();
}

Binder.prototype.renderMethods = {
	on: function () {
		var self = this;

		if (!self.eventName) {
			self.eventName = self.attribute.cmds[1];
			self.eventMethod = Utility.getByPath(self.events, self.attribute.path).bind(self.model.data);
		}

		self.element.removeEventListener(self.eventName, self.eventMethod);
		self.element.addEventListener(self.eventName, self.eventMethod);
	},
	each: function () {
		var self = this;

		self.data = self.data || [];

		if (!self.clone) {
			self.variable = self.attribute.cmds.slice(1).join('.');
			self.clone = self.element.removeChild(self.element.children[0]).outerHTML;
			self.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + self.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
		}

		if (self.element.children.length > self.data.length) {
			while (self.element.children.length > self.data.length) {
				self.view.removeAll(self.element.children[self.element.children.length-1].querySelectorAll('*'));
				self.view.removeOne(self.element.children[self.element.children.length-1]);
				self.element.removeChild(self.element.children[self.element.children.length-1]);
			}
		} else if (self.element.children.length < self.data.length) {
			while (self.element.children.length < self.data.length) {
				self.element.insertAdjacentHTML(
					'beforeend',
					self.clone.replace(
						self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
					)
				);
				self.view.addAll(self.element.children[self.element.children.length-1].querySelectorAll('*'));
				self.view.addOne(self.element.children[self.element.children.length-1]);
			}
		}

	},
	value: function () {
		var self = this;

		if (self.change) return;
		if (self.element.type === 'button' || self.element.type === 'reset') return self.change = true;

		self.change = function () {
			self.data = self.element.type !== 'radio' && self.element.type !== 'checked' ? self.element.value : self.element.checked;
		};

		self.element.addEventListener('change', self.change.bind(self), true);
		self.element.addEventListener('keyup', self.change.bind(self), true);
	},
	html: function () {
		this.element.innerHTML = this.data;
		this.view.addAll(this.element.querySelectorAll('*'));
	},
	css: function () {
		var css = this.data;

		if (this.attribute.cmds.length > 1) {
			css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
		}

		this.element.style.cssText += css;
	},
	class: function () {
		var className = this.attribute.cmds.slice(1).join('-');
		this.element.classList.toggle(className, this.data);
	},
	text: function () {
		this.element.innerText = this.data;
	},
	enable: function () {
		this.element.disabled = !this.data;
	},
	disable: function () {
		this.element.disabled = this.data;
	},
	show: function () {
		this.element.hidden = !this.data;
	},
	hide: function () {
		this.element.hidden = this.data;
	},
	write: function () {
		this.element.readOnly = !this.data;
	},
	read: function () {
		this.element.readOnly = this.data;
	},
	readOnly: function () {
		this.element.readOnly = this.data;
	},
	selected: function () {
		this.element.selectedIndex = this.data;
	},
	default: function () {
		var path = Utility.toCamelCase(this.attribute.cmds);
		Utility.setByPath(this.element, path, this.data);
	}
};

Binder.prototype.unrenderMethods = {
	on: function () {
		var eventName = this.attribute.cmds[1];
		this.element.removeEventListener(eventName, this.data, false);
	},
	each: function () {
		while (this.element.lastChild) {
			this.element.removeChild(this.element.lastChild);
		}
	},
	value: function () {
		this.element.removeEventListener('change', this.change.bind(this));
		this.element.removeEventListener('keyup', this.change.bind(this));
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
	this.unrenderMethod();
	return this;
};

Binder.prototype.render = function () {
	this.renderMethod();
	return this;
};
