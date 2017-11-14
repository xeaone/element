import Utility from './utility';
import Global from '../global';

export default 	function Binder (options) {
	this.cache;

	this.uid = options.uid;
	this.element = options.element;
	this.container = options.container;
	this.attribute = options.attribute;

	this.keys = this.attribute.opts;
	this.events = this.container.events;
	this.modifiers = this.container.modifiers;
	this.type = this.attribute.cmds[0] || 'default';

	this.keys.unshift(this.uid);

	this.ensureData();
	this.setup();
	this.render();
}

Binder.prototype.ensureData = function (data) {
	if (data === undefined) {
		return Global.model.ensureGet(this.keys);
	} else {
		return Global.model.ensureSet(this.keys, data);
	}
};

Binder.prototype.setData = function (data) {
	return Global.model.set(this.keys, data);
};

Binder.prototype.getData = function () {
	var data = Global.model.get(this.keys);

	// if (data === undefined) {
	// 	console.warn('Binder.getData - undefined: ' + this.attribute.path);
	// }

	return data === undefined ? data : this.modifyData(data);
};

Binder.prototype.modifyData = function (data) {
	var model = Global.model.get([this.uid]);

	for (var i = 0, l = this.attribute.modifiers.length; i < l; i++) {
		data = this.modifiers[this.attribute.modifiers[i]].call(model, data);
	}

	return data;
};

Binder.prototype.setupMethods = {
	value: function (data) {
		var i , l;
		if (this.element.type === 'checkbox') {
			data = !data ? false : data;
			this.element.checked = data;
			this.element.value = data;
		} else if (this.element.nodeName === 'SELECT') {
			var options = this.element.options;
			data = this.element.multiple ? [] : data;
			for (i = 0, l = options.length; i < l; i++) {
				var option = options[i];
				if (option.selected) {
					if (this.element.multiple) {
						data.push(option.value);
					} else {
						data = option.value;
						break;
					}
				}
			}
		} else if (this.element.type === 'radio') {
			var query = 'input[type="radio"][o-value="' + this.attribute.value + '"]';
			var elements = this.element.parentNode.querySelectorAll(query);
			for (i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				radio.checked = i === data;
			}
		} else {
			data = data === undefined ? '' : data;
			this.element.value = data;
		}
		return data;
	},
	on: function () {
		var model = Global.model.get([this.uid]);
		this.cache = Utility.getByPath(this.events, this.attribute.path).bind(model);
	},
	each: function (data) {
		this.variable = this.attribute.cmds[1];
		this.pattern = new RegExp('\\$(' + this.variable + '|index)', 'ig');
		this.clone = this.element.removeChild(this.element.firstElementChild);
		this.clone = this.clone.outerHTML.replace(
			new RegExp('((?:data-)?o-.*?=")' + this.variable + '((?:\\.\\w+)*\\s*(?:\\|.*?)?")', 'g'),
			'$1' + this.attribute.path + '.$' + this.variable + '$2'
		);

		return data || [];
	},
	text: function (data) {
		return data === null ? '' : data;
	},
	enable: function (data) {
		return data === false ? false : true;
	},
	disable: function (data) {
		return data === false ? false : true;
	},
	show: function (data) {
		return data === false ? false : true;
	},
	hide: function (data) {
		return data === false ? false : true;
	},
	write: function (data) {
		return data === false ? false : true;
	},
	read: function (data) {
		return data === false ? false : true;
	},
	required: function (data) {
		return data === false ? false : true;
	},
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
				this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, this.element.children.length));
			}
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
	required: function (data) {
		this.element.required = data;
	},
	selected: function (data) {
		this.element.selectedIndex = data;
	},
	href: function (data) {
		this.element.href = data;
	},
	src: function (data) {
		this.element.src = data;
	},
	alt: function (data) {
		this.element.alt = data;
	},
	default: function () {}
};

Binder.prototype.unrenderMethods = {
	on: function () {
		this.element.removeEventListener(this.attribute.cmds[1], this.cache, false);
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
	required: function () {
		this.element.required = false;
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
		var data = this.getData();
		data = this.setupMethods[this.type].call(this, data);
		this.setData(data);
	}
	return this;
};

Binder.prototype.unrender = function () {
	if (this.type in this.unrenderMethods) {
		Global.batcher.write(this.unrenderMethods[this.type].bind(this));
	}
	return this;
};

Binder.prototype.render = function () {
	if (this.type in this.renderMethods) {
		var data = this.cache || this.getData();
		Global.batcher.write(this.renderMethods[this.type].bind(this, data));
	}
	return this;
};
