import Utility from './utility';

export default function Binder (options) {
	var self = this;

	this.element = options.element;
	this.container = options.container;
	this.view = this.container.view;
	this.model = this.container.model;
	this.events = this.container.events;
	this.modifiers = this.container.modifiers;
	// this.attribute = options.attribute;

	this.attributes = this.createAttributes(this.element.attributes);
	this.bind = this.createBind(this.element.attributes);

	this.binds = this.bind.split(',');
	this._data = {};
	this.data = {};
	// this.type = this.attribute.cmds[0] || 'default';
	// this.renderType = this.attribute.cmds[0] || 'default';

	for (var i = 0; i < this.attributes.length; i++) {
		var attribute = this.attributes[i];
		var type = attribute.cmds[0];

		if (type === 'on') {
			this.data[attribute.cmds[0]+attribute.cmds[1]] = Utility.getByPath(this.events, attribute.path).bind(this.model);
			// this.data = Utility.getByPath(this.events, this.attribute.path).bind(this.model);
		} else {
			// var paths = attribute.path.split('.');
			// var key = paths.slice(-1)[0];
			// var path = paths.slice(0, -1).join('.');
			this._data[type] = attribute.parentPath ? Utility.getByPath(this.model, attribute.parentPath) : this.model;

			Object.defineProperty(this.data, type, {
				enumerable: true,
				configurable: false,
				// set: function (data) {
				// 	if (this._data === undefined) return;
				// 	data = this.modify(data);
				// 	return this._data[this.key] = data;
				// },
				get: function () {
					if (self._data[type] === undefined) return;
					var data = self._data[type][attribute.key];
					data = self.modify(data);
					return data;
				}
			});

			if (type in this.setup) {
				this.setup[type].call(this);
			}
		}
	}

	this.renderAll();
}

Binder.prototype.PATH = /\s?\|(.*?)$/;
Binder.prototype.PREFIX = /(data-)?j-/;
Binder.prototype.MODIFIERS = /^(.*?)\|\s?/;
Binder.prototype.BIND = /(?:data-)?j-(\w+).*/;

Binder.prototype.createAttribute = function (att) {
	var attribute = {};
	attribute.name = att.name;
	attribute.value = att.value;
	// attribute.path = attribute.value.replace(this.PATH, '');
	// attribute.vpath = attribute.cmds[0] === 'each' ? attribute.path + '.length' : attribute.path;


	attribute.cmds = attribute.name.replace(this.PREFIX, '').split('-');
	attribute.opt = attribute.value.replace(this.PATH, '');
	attribute.opts = attribute.opt.split('.');
	attribute.path = attribute.cmds[0] === 'each' ? attribute.opt + '.length' : attribute.opt;
	// attribute.command = attribute.name.replace(this.PREFIX, '');
	// attribute.cmds = attribute.command.split('-');
	attribute.key = attribute.opts.slice(-1)[0];
	attribute.parentPath = attribute.opts.slice(0, -1).join('.');
	attribute.modifiers = attribute.value.indexOf('|') === -1 ? [] : attribute.value.replace(this.MODIFIERS, '').split(' ');
	return attribute;
};

Binder.prototype.createAttributes = function (atts) {
	var attributes = [];
	for (var i = 0, l = atts.length; i < l; i++) {
		attributes.push(this.createAttribute(atts[i]));
	}
	return attributes;
};

Binder.prototype.createBind = function (atts) {
	var bind = '';
	for (var i = 0, l = atts.length; i < l; i++) {
		var name = atts[i].name;
		if (name.indexOf('data-j-') === 0 || name.indexOf('j-') === 0) {
			bind += ',' + name.replace(this.BIND, '$1');
		}
	}
	return bind.slice(1);
};

Binder.prototype.modify = function (data) {
	for (var i = 0, l = this.attribute.modifiers.length; i < l; i++) {
		data = this.modifiers[this.attribute.modifiers[i]].call(this.model, data);
		if (data === undefined) throw new Error('modifier value is undefined');
	}
	return data;
};

Binder.prototype.setup = {
	each: function () {
		this.variable = this.attribute.cmds.slice(1).join('.');
		this.clone = this.element.removeChild(this.element.children[0]).outerHTML;
		this.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + this.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');
	}
};

Binder.prototype.renders = {
	on: function (data) {
		this.element.removeEventListener(this.attribute.cmds[1], data);
		this.element.addEventListener(this.attribute.cmds[1], data);
	},
	each: function (data) {
		if (this.element.children.length > data.length) {
			while (this.element.children.length > data.length) {
				this.element.removeChild(this.element.children[this.element.children.length-1]);
			}
		} else if (this.element.children.length < data.length) {
			while (this.element.children.length < data.length) {
				this.element.insertAdjacentHTML(
					'beforeend',
					this.clone.replace(
						this.pattern, '$1' + this.attribute.path + '.' + this.element.children.length + '$6'
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

Binder.prototype.unrenders = {
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
	for (var i = 0; i < this.types.length; i++) {
		this.unrenders[this.types[i]].call(this);
	}
	return this;
};

Binder.prototype.render = function () {
	for (var i = 0; i < this.types.length; i++) {
		this.renders[this.types[i]].call(this);
	}
	return this;
};
