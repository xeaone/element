import Utility from '../utility';

export default function Binder (options) {
	// this.data = options.data;
	this.view = options.view;
	this.model = options.model;
	this.events = options.events;
	this.element = options.element;
	this.modifiers = options.modifiers;
	this.attribute = options.attribute;
	this.renderMethod = this.renderMethods[this.attribute.cmds[0]]; // || this.renderMethods['default'];
	this.unrenderMethod = this.unrenderMethods[this.attribute.cmds[0]]; // || this.unrenderMethods['default'];

	// NOTE might be able to cache the parent object
	// this.key = this.attribute.path.split('.').pop();
	// this.data = Utility.getByPath(this.model.data, this.attribute.path);
	// this.data = typeof this.data === 'object' ? this.data : Utility.getByPath(this.model.data, this.attribute.path.split('.').slice(0, -1).join('.'));

	this.renderMethod();
}

Binder.prototype.setModel = function (data) {
	this.modifiers.forEach(function (modifier) {
		data = modifier.call(data);
	});

	return Utility.setByPath(this.model.data, this.attribute.path, data);
};

Binder.prototype.getModel = function () {
	var data = Utility.getByPath(this.model.data, this.attribute.path);

	this.modifiers.forEach(function (modifier) {
		data = modifier.call(data);
	});

	return data;
};

Binder.prototype.renderMethods = {
	on: function () {
		if (!this.eventName) {
			this.eventName = this.attribute.cmds[1];
			this.eventMethod = Utility.getByPath(this.events, this.attribute.path).bind(this.getModel());
		}

		this.element.removeEventListener(this.eventName, this.eventMethod);
		this.element.addEventListener(this.eventName, this.eventMethod);
	},
	each: function () {
		var model = this.getModel();

		if (!this.clone) {
			this.variable = this.attribute.cmds.slice(1).join('.');
			this.clone = this.element.removeChild(this.element.children[0]).outerHTML;
			this.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + this.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
		}

		if (this.element.children.length > model.length) {
			while (this.element.children.length > model.length) {
				this.view.removeAll(this.element.children[this.element.children.length-1].querySelectorAll('*'));
				this.view.removeOne(this.element.children[this.element.children.length-1]);
				this.element.removeChild(this.element.children[this.element.children.length-1]);
			}
		} else if (this.element.children.length < model.length) {
			while (this.element.children.length < model.length) {
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

		var model = this.getModel();

		if (this.element.type === 'checkbox') {
			if (this.element.checked !== model) {
				this.element.value = this.element.checked = model;
			}
		} if (this.element.nodeName === 'SELECT' && this.element.multiple) {
			if (this.element.options.length !== model.length) {
				Array.prototype.forEach.call(this.element.options, function (option, index) {
					if (option.value === model[index]) {
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
					radio.checked = index === model;
				},
			this);
		} else {
			this.element.value = model;
		}

		this.isSetup = true;
	},
	html: function () {
		this.element.innerHTML = this.getModel();
		this.view.addAll(this.element.querySelectorAll('*'));
	},
	css: function () {
		var css = this.getModel();

		if (this.attribute.cmds.length > 1) {
			css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
		}

		this.element.style.cssText += css;
	},
	class: function () {
		var className = this.attribute.cmds.slice(1).join('-');
		this.element.classList.toggle(className, this.getModel());
	},
	text: function () {
		this.element.innerText = this.getModel().toString();
	},
	enable: function () {
		this.element.disabled = !this.getModel();
	},
	disable: function () {
		this.element.disabled = this.getModel();
	},
	show: function () {
		this.element.hidden = !this.getModel();
	},
	hide: function () {
		this.element.hidden = this.getModel();
	},
	write: function () {
		this.element.readOnly = !this.getModel();
	},
	read: function () {
		this.element.readOnly = this.getModel();
	},
	selected: function () {
		this.element.selectedIndex = this.getModel();
	}
	// ,
	// default: function () {
	// 	var path = Utility.toCamelCase(this.attribute.cmds);
	// 	Utility.setByPath(this.element, path, this.getModel());
	// }
};

Binder.prototype.unrenderMethods = {
	on: function () {
		var eventName = this.attribute.cmds[1];
		this.element.removeEventListener(eventName, this.getModel(), false);
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
		this.setModel(this.element.value = this.element.checked);
	} if (this.element.nodeName === 'SELECT' && this.element.multiple) {
		this.setModel(Array.prototype.filter.call(this.element.options, function (option) {
			return option.selected;
		}).map(function (option) {
			return option.value;
		}));
	} else if (this.element.type === 'radio') {
		Array.prototype.forEach.call(
			this.element.parentNode.querySelectorAll(
				'input[type="radio"][type="radio"][j-value="' + this.attribute.value + '"]'
			),
			function (radio, index) {
				if (radio === this.element) this.setModel(index);
				else radio.checked = false;

			},
		this);
	} else {
		this.setModel(this.element.value);
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
