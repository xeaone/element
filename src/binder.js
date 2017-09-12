import Utility from './utility';

export default function Binder (options) {
	this.element = options.element;
	this.container = options.container;
	this.attribute = options.attribute;

	this.view = this.container.view;
	this.model = this.container.model;
	this.events = this.container.events;
	this.modifiers = this.container.modifiers;
	this.type = this.attribute.cmds[0] || 'default';
	this.renderType = this.attribute.cmds[0] || 'default';

	if (this.renderType === 'on') {
		this.data = Utility.getByPath(this.events, this.attribute.path).bind(this.model);
	} else {
		this.paths = this.attribute.path.split('.');
		this.key = this.paths.slice(-1)[0];
		this.path = this.paths.slice(0, -1).join('.');
		this._data = this.path ? Utility.getByPath(this.model, this.path) : this.model;

		Object.defineProperty(this, 'data', {
			enumerable: true,
			configurable: false,
			// set: function (data) {
			// 	if (this._data === undefined) return;
			// 	data = this.modify(data);
			// 	return this._data[this.key] = data;
			// },
			get: function () {
				if (this._data === undefined) return;
				var data = this._data[this.key];
				data = this.modify(data);
				return data;
			}
		});

		if (this.type in this.setup) {
			this.setup[this.type].call(this);
		}
	}

	this.render();
}

Binder.prototype.modify = function (data) {
	for (var i = 0, l = this.attribute.modifiers.length; i < l; i++) {
		data = this.modifiers[this.attribute.modifiers[i]].call(this.model, data);
		if (data === undefined) throw new Error('modifier value is undefined');
	}
	return data;
};

Binder.prototype.setup = {
	each: function () {
		this.variable = this.attribute.cmds[1];
		this.clone = this.element.removeChild(this.element.firstElementChild).outerHTML;
		this.pattern = new RegExp('((?:data-)?j-.*?=")' + this.variable + '(.*?")', 'g');
		// this.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + this.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
	}
};

Binder.prototype.renderMethods = {
	on: function (data) {
		this.element.removeEventListener(this.attribute.cmds[1], data);
		this.element.addEventListener(this.attribute.cmds[1], data);
	},
	each: function (data) {
		if (this.element.children.length > data.length) {
			while (this.element.children.length > data.length) {
				this.element.removeChild(this.element.lastElementChild);
			}
		} else if (this.element.children.length < data.length) {
			while (this.element.children.length < data.length) {
				this.element.insertAdjacentHTML('beforeend',
					this.clone.replace(
						this.pattern, '$1' + this.attribute.path + '.' + this.element.children.length + '$2'
						// this.pattern, '$1' + this.attribute.path + '.' + this.element.children.length + '$6'
					)
				);
			}
		}
	},
	html: function (data) {
		this.element.innerHTML = data;
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
		this.element.innerText = Utility.toText(data);
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
	on: function () {
		console.log('removeEventListener');
		this.element.removeEventListener(this.attribute.cmds[1], this.data, false);
	},
	each: function () {
		Utility.removeChildren(this.element);
	},
	html: function () {
		Utility.removeChildren(this.element);
	},
	text: function () {
		this.element.innerText = '';
	},
	default: function () {

	}
};

Binder.prototype.unrender = function () {
	this.unrenderMethods[this.renderType].call(this, this.data);
	return this;
};

Binder.prototype.render = function () {
	// var data = this.renderType === 'on' ? this.data : this.getData();
	// if (this.data === undefined) return;
	this.renderMethods[this.renderType].call(this, this.data);
	return this;
};
