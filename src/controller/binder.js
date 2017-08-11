import Utility from '../utility';

export default function Binder (options) {
	this.data = options.data;
	this.view = options.view;
	this.model = options.model;
	this.events = options.events;
	this.element = options.element;
	this.modifiers = options.modifiers;
	this.attribute = options.attribute;
	this.renderMethod = this.renderMethods[this.attribute.cmds[0]]; // || this.renderMethods['default'];
	this.unrenderMethod = this.unrenderMethods[this.attribute.cmds[0]]; // || this.unrenderMethods['default'];

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
		// NOTE this fires for every change
		if (this.isSetup) return;

		if (this.element.type === 'checkbox') {
			if (this.element.checked !== this.data) {
				this.element.value = this.element.checked = this.data;
			}
		} if (this.element.nodeName === 'SELECT' && this.element.multiple) {
			if (this.element.options.length !== this.data.length) {
				Array.prototype.forEach.call(this.element.options, function (option, index) {
					if (option.value === this.data[index]) {
						option.selected;
					}
				}, this);
			}
		} else if (this.element.type === 'radio') {
			Array.prototype.forEach.call(
				this.element.parentNode.querySelectorAll(
					'input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]'
				),
				function (radio, index) {
					radio.checked = index === this.data;
				},
			this);
		} else {
			this.element.value = this.data;
		}

		this.isSetup = true;
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
		this.element.innerText = this.data.toString();
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
	}
	// ,
	// default: function () {
	// 	var path = Utility.toCamelCase(this.attribute.cmds);
	// 	Utility.setByPath(this.element, path, this.data);
	// }
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
	html: function () {
		this.element.innerText = '';
	},
	text: function () {
		this.element.innerText = '';
	}
	// ,
	// default: function () {
	//
	// }
};

Binder.prototype.updateModel = function () {
	if (this.element.type === 'checkbox') {
		this.data = this.element.value = this.element.checked;
	} if (this.element.nodeName === 'SELECT' && this.element.multiple) {
		this.data = Array.prototype.filter.call(this.element.options, function (option) {
			return option.selected;
		}).map(function (option) {
			return option.value;
		});
	} else if (this.element.type === 'radio') {
		Array.prototype.forEach.call(
			this.element.parentNode.querySelectorAll(
				'input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]'
			),
			function (radio, index) {
				if (radio === this.element) this.data = index;
				else radio.checked = false;

			},
		this);
	} else {
		this.data = this.element.value;
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
