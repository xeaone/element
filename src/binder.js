import Utility from './utility';
import Batcher from './batcher';
import Global from './global';

// TODO sanitize input/output

export default 	function Binder (options) {

	this.element = options.element;
	this.container = options.container;
	this.attribute = options.attribute;

	this.model = this.container.model;
	this.events = this.container.events;
	this.modifiers = this.container.modifiers;
	this.type = this.attribute.cmds[0] || 'default';

	if (this.type === 'on') {
		this.data = Utility.getByPath(this.events, this.attribute.path).bind(this.model);
	} else {
		Object.defineProperty(this, 'data', {
			enumerable: true,
			configurable: false,
			get: function () {
				var data = Utility.getByPath(this.model, this.attribute.path);

				if (data === undefined) {
					console.warn('Binder - undefined path \"' + this.attribute.path + '\"');
				}

				return this.modify(data);
			}
		});

	}

	this.setup();
	this.render();
}

Binder.prototype.modify = function (data) {
	if (!data) return data;

	for (var i = 0, l = this.attribute.modifiers.length; i < l; i++) {

		data = this.modifiers[this.attribute.modifiers[i]].call(this.model, data);

		if (data === undefined) {
			console.warn('Binder - undefined modifier \"' + this.attribute.modifiers[i] + '\"');
		}

	}

	return data;
};

Binder.prototype.setupMethods = {
	each: function () {
		this.variable = this.attribute.cmds[1];
		this.pattern = new RegExp('\\$(' + this.variable + '|index)', 'ig');
		this.clone = this.element.removeChild(this.element.firstElementChild);
		this.clone = this.clone.outerHTML.replace(
			new RegExp('((?:data-)?o-.*?=")' + this.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
			'$1' + this.attribute.path + '.$' + this.variable + '$2'
		);
	}
};

Binder.prototype.renderMethods = {
	on: function () {
		this.element.removeEventListener(this.attribute.cmds[1], this.data);
		this.element.addEventListener(this.attribute.cmds[1], this.data);
	},
	each: function () {
		if (typeof this.data !== 'object') {
			return;
		} else if (this.element.children.length > this.data.length) {
			this.element.removeChild(this.element.lastElementChild);
			this.render();
		} else if (this.element.children.length < this.data.length) {
			this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, this.element.children.length));
			this.render();
		}
	},
	html: function () {
		this.element.innerHTML = this.data;
	},
	css: function (data) {
		if (this.attribute.cmds.length > 1) {
			this.data = this.attribute.cmds.slice(1).join('-') + ': ' +  this.data + ';';
		}
		this.element.style.cssText += this.data;
	},
	class: function () {
		var className = this.attribute.cmds.slice(1).join('-');
		this.element.classList.toggle(className, this.data);
	},
	text: function () {
		this.element.innerText = Utility.toText(this.data);
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
	href: function () {
		this.element.href = this.data;
	},
	src: function () {
		this.element.src = this.data;
	},
	alt: function () {
		this.element.alt = this.data;
	},
	required: function () {
		this.element.required = this.data;
	},
	default: function () {}
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
	href: function () {
		this.element.href = '';
	},
	src: function () {
		this.element.src = '';
	},
	alt: function () {
		this.element.alt = '';
	},
	default: function () {}
};

Binder.prototype.setup = function () {
	if (this.type in this.setupMethods) {
		this.setupMethods[this.type].call(this);
	}
	return this;
};

Binder.prototype.unrender = function () {
	if (this.type in this.unrenderMethods) {
		Batcher.write(this.unrenderMethods[this.type].bind(this));
	}
	return this;
};

Binder.prototype.render = function () {
	if (this.type in this.renderMethods) {
		Batcher.write(this.renderMethods[this.type].bind(this));
	}
	return this;
};
