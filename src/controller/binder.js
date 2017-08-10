import Utility from '../utility';

export default function Binder (options) {
	this.data = options.data;
	this.view = options.view;
	this.model = options.model;
	this.events = options.events;
	this.element = options.element;
	this.modifiers = options.modifiers;
	this.attribute = options.attribute;
	this.renderMethod = (this.renderMethods[this.attribute.cmds[0]] || this.renderMethods['default']).bind(this);
	this.unrenderMethod = (this.unrenderMethods[this.attribute.cmds[0]] || this.unrenderMethods['default']).bind(this);

	Object.defineProperty(this, 'data', {
		enumerable: true,
		configurable: true,
		get: function () {
			var data = Utility.getByPath(this.model.data, this.attribute.path);

			this.modifiers.forEach(function (modifier) {
				data = modifier.call(data);
			});

			return data;
		},
		set: function (data) {

			this.modifiers.forEach(function (modifier) {
				data = modifier.call(data);
			});

			return Utility.setByPath(this.model.data, this.attribute.path, data);
		}
	});

	this.renderMethod();
}

Binder.prototype.renderMethods = {
	on: function () {
		if (!this.eventName) {
			this.eventName = this.attribute.cmds[1];
			this.eventMethod = Utility.getByPath(this.events, this.attribute.path).bind(this.model.data);
		}

		this.element.removeEventListener(this.eventName, this.eventMethod);
		this.element.addEventListener(this.eventName, this.eventMethod);
	},
	each: function () {
		this.data = this.data || [];

		if (!this.clone) {
			this.variable = this.attribute.cmds.slice(1).join('.');
			this.clone = this.element.removeChild(this.element.children[0]).outerHTML;
			this.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + this.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
		}

		if (this.element.children.length > this.data.length) {
			while (this.element.children.length > this.data.length) {
				this.view.removeAll(this.element.children[this.element.children.length-1].querySelectorAll('*'));
				this.view.removeOne(this.element.children[this.element.children.length-1]);
				this.element.removeChild(this.element.children[this.element.children.length-1]);
			}
		} else if (this.element.children.length < this.data.length) {
			while (this.element.children.length < this.data.length) {
				this.element.insertAdjacentHTML(
					'beforeend',
					this.clone.replace(
						this.pattern, '$1' + this.attribute.path + '.' + this.element.children.length + '$6'
					)
				);
				this.view.addAll(this.element.children[this.element.children.length-1].querySelectorAll('*'));
				this.view.addOne(this.element.children[this.element.children.length-1]);
			}
		}

	},
	value: function () {
		if (this.element.type !== 'button' || this.element.type !== 'reset') {
			if (this.element.type === 'checkbox') {
				if (this.isSetup && this.data !== this.element.checked) {
					this.data = this.element.checked;
				} else {
					this.isSetup = true;
					this.element.checked = this.data;
				}
			} else if (this.element.type === 'radio') {
				var i = 0, radios, index;

				if (this.isSetup) {
					if (this.element.checked) {
						radios = this.element.parentNode.querySelectorAll('input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]');

						for (i; i < radios.length; i++) {
							if (radios[i] === this.element) index = i;
							else radios[i].checked = false;
						}

						if (this.data !== index) this.data = index;
					}
				} else {
					radios = this.element.parentNode.querySelectorAll('input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]');

					for (i; i < radios.length; i++) {
						if (i === this.data) radios[i].checked = true;
						else radios[i].checked = false;
					}

					this.isSetup = true;
				}
			} else {
				if (this.isSetup && this.data !== this.element.value) {
					this.data = this.element.value;
				} else {
					this.isSetup = true;
					this.element.value = this.data;
				}
			}
		}
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
