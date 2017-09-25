import INDEX from './index';
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

	if (this.type === 'on') {
		this.data = Utility.getByPath(this.events, this.attribute.path).bind(this.model);
	} else {
		this._data = this.attribute.parentPath ? Utility.getByPath(this.model, this.attribute.parentPath) : this.model;

		Object.defineProperty(this, 'data', {
			enumerable: true,
			configurable: false,
			get: function () {
				if (this._data === undefined) return;
				var data = this._data[this.attribute.parentKey];
				data = this.modify(data);
				return data;
			}
		});

		this.setup();
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

Binder.prototype.setupMethods = {
	each: function () {
		this.count = 0;
		this.pattern = /\$INDEX/g;
		this.variable = this.attribute.cmds[1];
		this.clone = this.element.removeChild(this.element.firstElementChild)
		this.clone = this.clone.outerHTML.replace(
			new RegExp('((?:data-)?o-.*?=")' + this.variable + '(.*?")', 'g'),
			'$1' + this.attribute.path + '.$INDEX$2'
		);
	}
};

Binder.prototype.renderMethods = {
	on: function (data) {
		this.element.removeEventListener(this.attribute.cmds[1], data);
		this.element.addEventListener(this.attribute.cmds[1], data);
	},
	each: function (data) {
		if (this.count > data.length) {
			this.element.removeChild(this.element.lastElementChild);
			this.count--;
			this.render();
		} else if (this.count < data.length) {
			this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, this.count));
			this.count++;
			this.render();
		}
	},
	html: function (data) {
		this.element.innerHTML = data;
	},
	css: function (data) {
		if (this.attribute.cmds.length > 1) {
			data = this.attribute.cmds.slice(1).join('-') + ': ' +  data + ';';
		}
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
	default: function () { //data
		// Utility.setByPath(this.element, Utility.toCamelCase(this.attribute.cmds), data);
	}
};

Binder.prototype.unrenderMethods = {
	on: function () {
		this.element.removeEventListener(this.attribute.cmds[1], this.data, false);
	},
	each: function () {
		Utility.removeChildren(this.element);
	},
	html: function () {
		Utility.removeChildren(this.element);
	},
	css: function () {
		this.element.style.cssText = '';
	},
	class: function () {
		var className = this.attribute.cmds.slice(1).join('-');
		this.element.classList.remove(className);
	},
	text: function () {
		this.element.innerText = '';
	},
	default: function () {

	}
};

Binder.prototype.setup = function () {
	if (this.type in this.setupMethods) {
		this.setupMethods[this.type].call(this, this.data)
		// INDEX.batcher.write(this.setupMethods[this.type].bind(this, this.data));
	}
};

Binder.prototype.unrender = function () {
	if (this.type in this.unrenderMethods) {
		INDEX.batcher.write(this.unrenderMethods[this.type].bind(this, this.data));
	}
	return this;
};

Binder.prototype.render = function () {
	if (this.type in this.renderMethods) {
		INDEX.batcher.write(this.renderMethods[this.type].bind(this, this.data));
	}
	return this;
};
