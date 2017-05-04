var Utility = require('../utility');

module.exports = {
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
		var self = this, pattern, last;

		if (self.length) {
			if (self.data.length < self.length) {
				last = self.data.length.toString();
				pattern = '^' + self.attribute.path + '\\.' + last;
				console.log(pattern);
				self.binder._view.removeAll(pattern);

				self.binder._view.eachPath('^' + self.attribute.path + '\\.\\d+', function (units) {
					units.forEach(function (unit, index) {
						console.log(unit);
					});
				});
			} else {
				// self.container.innerHTML = self.clone.replace(self.pattern, '$1' + self.attribute.path + '.' + (self.data.length-1).toString() + '$6');
				// self.element.appendChild(self.container.children[0]);
			}
		} else {
			self.container = document.createElement('div');
			self.variable = self.attribute.cmds.slice(1).join('.');
			self.clone = self.element.removeChild(self.element.children[0]).outerHTML;
			self.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + self.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');

			self.data.forEach(function (data, index) {
				self.container.innerHTML = self.clone.replace(self.pattern, '$1' + self.attribute.path + '.' + index.toString() + '$6');
				self.element.appendChild(self.container.children[0]);
			});

			self.bindChildren();
		}

		self.length = self.data.length;

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
