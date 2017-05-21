
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
		if (!this.clone) {
			this.variable = this.attribute.cmds.slice(1).join('.');
			this.clone = this.element.removeChild(this.element.children[0]).outerHTML;
			this.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + this.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');

			this.data.forEach(function (data, index) {
				this.element.insertAdjacentHTML(
					'beforeend',
					this.clone.replace(
						this.pattern, '$1' + this.attribute.path + '.' + index + '$6'
					)
				);
			}, this);

			this.view.addAll(this.element.getElementsByTagName('*'));
		} else if (this.element.children.length > this.data.length) {
			while (this.element.children.length > this.data.length) {
				this.view.removeAll(this.element.lastChild.getElementsByTagName('*'));
				this.view.removeOne(this.element.lastChild);
				this.element.removeChild(this.element.lastChild);
			}
		} else if (this.element.children.length < this.data.length) {
			while (this.element.children.length < this.data.length) {
				this.element.insertAdjacentHTML(
					'beforeend',
					this.clone.replace(
						this.pattern, '$1' + this.attribute.path + '.' + this.element.children.length + '$6'
					)
				);
				this.view.addOne(this.element.lastChild);
				this.view.addAll(this.element.lastChild.getElementsByTagName('*'));
			}
		}
	},
	value: function () {
		if (this.change) return;
		if (this.element.type === 'button' || this.element.type === 'reset') return this.change = true;

		this.change = function () {
			this.data = this.element.type !== 'radio' && this.element.type !== 'checked' ? this.element.value : this.element.checked;
		};

		this.element.addEventListener('change', this.change.bind(this), true);
		this.element.addEventListener('keyup', this.change.bind(this), true);
	},
	html: function () {
		this.element.innerHTML = this.data;
		this.view.addAll(this.element.getElementsByTagName('*'));
	},
	css: function () {
		var css = this.data;
		if (this.attribute.cmds.length > 1) css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
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
	selected: function () {
		this.element.selectedIndex = this.data;
	},
	default: function () {
		var path = this.toCamelCase(this.attribute.cmds);
		this.setByPath(this.element, path, this.data);
	}
};

Unit.prototype.unrenderMethods = {
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
		this.element.innerHTML = 'undefined';
	},
	text: function () {
		this.element.innerText = 'undefined';
	},
	default: function () {

	}
};

Unit.prototype.unrender = function () {
	var self = this;

	window.requestAnimationFrame(function () {
		self.unrenderMethod();
	});

	return self;
};

Unit.prototype.render = function () {
	var self = this;

	window.requestAnimationFrame(function () {
		self.renderMethod();
	});

	return self;
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
