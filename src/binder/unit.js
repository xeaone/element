var Utility = require('./utility');

function Unit () {}

Unit.prototype.attributes = {
	on: function () {
		var self = this;

		if (typeof self.data !== 'function') return;

		var eventName = self.attribute.cmds[1];
		var methodName = self.attribute.opts[self.attribute.opts.length-1];

		self.element.removeEventListener(eventName, self.listeners[methodName], false);

		self.listeners[methodName] = function (e) {
			e.preventDefault();
			self.data.call(self, e);
		};

		self.element.addEventListener(eventName, self.listeners[methodName], false);
	},
	each: function () {
		var self = this;

		if (!self.container) self.container = document.createElement('div');
		if (!self.clone) self.clone = self.element.cloneNode(true);
		if (!self.children) self.children = [];

		var variable = self.attribute.cmds.slice(1).join('.');
		var pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');

		self.data.forEach(function (data, index) {
			self.container.innerHTML = self.clone.cloneNode(true).innerHTML
			.replace(pattern, '$1' + self.attribute.path + '.' + index.toString() + '$6');

			if (self.element.children[index]) {
				self.element.replaceChild(self.container.children[0], self.element.children[index]);
			} else if (self.element.children.length < self.data.length) {
				self.element.appendChild(self.container.children[0]);
			}
		});

		if (self.element.children.length > self.data.length) {
			while (self.element.children.length > self.data.length) {
				self.element.removeChild(self.element.children[self.element.children.length-1]);
			}
		}

		self.children.forEach(function (child, index) {
			self.children.slice(index, 1);
			self.binder._view.remove(child.path, child.index);
		});

		self.binder._view.set(self.element.getElementsByTagName('*'), function (unit, path, index) {
			unit.binder = self.binder;
			unit.data = self.binder._model.get(unit.attribute.path);
			unit.render();
			self.children.push({ path: path, index: index });
			return unit;
		});

	},
	value: function () {
		var self = this;

		if (self.element.type === 'checkbox' || self.element.type === 'radio') {
			self.element.value = self.data;
			self.element.checked = self.data;
		}

		if (self.isChangeEventAdded) return;
		else self.isChangeEventAdded = true;

		var change = function (e) {
			if (self.isChanging) return;
			else self.isChanging = true;

			var element = e.target;
			var value = element.type === 'checkbox' || element.type === 'radio' ? element.checked : element.value;

			self.binder._model.set(self.attribute.path, value);
			self.isChanging = false;
		};

		self.element.addEventListener('change', change);
		self.element.addEventListener('keyup', change);
	},
	html: function () {
		this.element.innerHTML = this.data;
		// this.binder.insert(this.element.getElementsByTagName('*'));
	},
	css: function () {
		var css = this.data;
		if (this.attribute.cmds.length > 1) css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
		this.element.style.cssText += css;
		// if (this.attribute.cmds.length > 1) this.data = this.attribute.cmds.slice(1).join('-') + ': ' +  this.data + ';';
		// this.element.style.cssText += this.data;
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
	selected: function () {
		this.element.selectedIndex = this.data;
	},
	default: function () {
		var path = Utility.toCamelCase(this.attribute.cmds);
		Utility.setByPath(this.element, path, this.data);
	}
};

Unit.prototype.render = function () {
	var self = this;

	self.attributes[
		self.attribute.cmds[0] in self.attributes ?
		self.attribute.cmds[0] :
		'default'
	].call(self);

	return self;
};

Unit.prototype.create = function (options) {
	var self = this;

	self.attribute = options.attribute;
	self.element = options.element;
	self.binder = options.binder;

	self.isChangeEventAdded = false;
	self.isChanging = false;
	self.isNew = true;
	self.listeners = {};

	self._data, self.clone;

	Object.defineProperty(self, 'data', {
		configurable: true,
		enumerable: true,
		get: function () {

			if (self._data === undefined) {
				self._data = self.binder._model.get(self.attribute.path);
			}

			self.attribute.modifiers.forEach(function (modifier) {
				self._data = self.binder.modifiers[modifier].call(self._data);
			});

			return self._data;
		},
		set: function (value) {
			self._data = value;
		}
	});

	return self;
};

module.exports = function (options) {
	return new Unit().create(options);
};
