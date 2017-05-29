
function Unit () {}

Unit.prototype.setByPath = function (collection, path, value) {
	var keys = path.split('.');
	var last = keys.length - 1;

	for (var i = 0, key; i < last; i++) {
		key = keys[i];
		if (collection[key] === undefined) collection[key] = {};
		collection = collection[key];
	}

	return collection[keys[last]] = value;
};

Unit.prototype.toCamelCase = function (data) {
	if (data.constructor.name === 'Array') data = data.join('-');
	return data.replace(/-[a-z]/g, function (match) {
		return match[1].toUpperCase();
	});
};

Unit.prototype.renderMethods = {
	on: function () {
		var eventName = this.attribute.cmds[1];
		this.element.removeEventListener(eventName, this.data, false);
		this.element.addEventListener(eventName, this.data, false);
	},
	each: function () {
		var self = this, animate;

		if (!self.data) {
			return;
		} else if (!self.clone) {

			self.variable = self.attribute.cmds.slice(1).join('.');
			self.clone = self.element.removeChild(self.element.children[0]).outerHTML;
			self.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + self.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');

			animate = function () {

				self.element.insertAdjacentHTML(
					'beforeend',
					self.clone.replace(
						self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
					)
				);

				self.view.addOne(self.element.lastChild);
				self.view.addAll(self.element.lastChild.getElementsByTagName('*'));

				if (self.element.children.length < self.data.length) {
					window.requestAnimationFrame(animate);
				}

			};

			window.requestAnimationFrame(animate);

		} else if (self.element.children.length > self.data.length) {

			animate = function () {

				if (self.element.children.length > self.data.length) {

					self.view.removeAll(self.element.lastChild.getElementsByTagName('*'));
					self.view.removeOne(self.element.lastChild);
					self.element.removeChild(self.element.lastChild);

					if (self.element.children.length > self.data.length) {
						window.requestAnimationFrame(animate);
					}

				}

			};

			window.requestAnimationFrame(animate);

		} else if (self.element.children.length < self.data.length) {

			animate = function () {

				if (self.element.children.length < self.data.length) {

					self.element.insertAdjacentHTML(
						'beforeend',
						self.clone.replace(
							self.pattern, '$1' + self.attribute.path + '.' + self.element.children.length + '$6'
						)
					);

					self.view.addOne(self.element.lastChild);
					self.view.addAll(self.element.lastChild.getElementsByTagName('*'));

					if (self.element.children.length < self.data.length) {
						window.requestAnimationFrame(animate);
					}

				}

			};

			window.requestAnimationFrame(animate);

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
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.innerHTML = self.data;
			self.view.addAll(self.element.getElementsByTagName('*'));
		});
	},
	css: function () {
		var self = this;
		var css = this.data;

		if (self.attribute.cmds.length > 1) {
			css = self.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
		}

		window.requestAnimationFrame(function () {
			self.element.style.cssText += css;
		});
	},
	class: function () {
		var self = this;
		var className = self.attribute.cmds.slice(1).join('-');

		window.requestAnimationFrame(function () {
			self.element.classList.toggle(className, self.data);
		});
	},
	text: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.innerText = self.data;
		});
	},
	enable: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.disabled = !self.data;
		});
	},
	disable: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.disabled = self.data;
		});
	},
	show: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.hidden = !self.data;
		});
	},
	hide: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.hidden = self.data;
		});
	},
	write: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.readOnly = !self.data;
		});
	},
	read: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.readOnly = self.data;
		});
	},
	selected: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.selectedIndex = self.data;
		});
	},
	default: function () {
		var self = this;
		var path = self.toCamelCase(self.attribute.cmds);

		window.requestAnimationFrame(function () {
			self.setByPath(self.element, path, self.data);
		});
	}
};

Unit.prototype.unrenderMethods = {
	on: function () {
		var eventName = this.attribute.cmds[1];
		this.element.removeEventListener(eventName, this.data, false);
	},
	each: function () {
		var self = this;

		var animate = function () {
			self.element.removeChild(self.element.lastChild);
			if (self.element.lastChild) animate();
		};

		window.requestAnimationFrame(animate);
	},
	value: function () {
		this.element.removeEventListener('change', this.change.bind(this));
		this.element.removeEventListener('keyup', this.change.bind(this));
	},
	html: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.innerText = '';
		});
	},
	text: function () {
		var self = this;

		window.requestAnimationFrame(function () {
			self.element.innerText = '';
		});
	},
	default: function () {

	}
};

Unit.prototype.unrender = function () {
	this.unrenderMethod();
	return this;
};

Unit.prototype.render = function () {
	this.renderMethod();
	return this;
};

Unit.prototype.create = function (options) {
	this.view = options.view;
	this.model = options.model;
	this.data = options.data;
	this.element = options.element;
	this.attribute = options.attribute;
	this.modifiers = options.modifiers;

	this.renderMethod = (this.renderMethods[this.attribute.cmds[0]] || this.renderMethods['default']).bind(this);
	this.unrenderMethod = (this.unrenderMethods[this.attribute.cmds[0]] || this.unrenderMethods['default']).bind(this);

	Object.defineProperty(this, 'data', {
		enumerable: true,
		configurable: true,
		get: function () {
			var data = this.model.get(this.attribute.path);

			this.modifiers.forEach(function (modifier) {
				data = modifier.call(data);
			});

			return data;
		},
		set: function (value) {
			return this.model.set(this.attribute.path, value);
		}
	});

	this.renderMethod();

	return this;
};

module.exports = function (options) {
	return new Unit().create(options);
};
