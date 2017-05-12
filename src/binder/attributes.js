var Utility = require('../utility');

module.exports = {
	on: function () {
		var eventName = this.attribute.cmds[1];
		this.element.removeEventListener(eventName, this.data, false);
		this.element.addEventListener(eventName, this.data, false);
	},
	each: function () {
		if (this.length === undefined) {
			this.length = this.data.length;
			this.variable = this.attribute.cmds.slice(1).join('.');
			this.clone = this.element.removeChild(this.element.children[0]).outerHTML;
			this.pattern = new RegExp('(((data-)?j(-(\\w)+)+="))' + this.variable + '(((\\.(\\w)+)+)?((\\s+)?\\|((\\s+)?(\\w)+)+)?(\\s+)?")', 'g');

			this.data.forEach(function (data, index) {
				this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, '$1' + this.attribute.path + '.' + index + '$6'));
			}, this);

			this.view.add(this.element.getElementsByTagName('*'), true);
		} else if (this.length > this.data.length) {
			this.length--;
			this.element.removeChild(this.element.lastChild);
		} else if (this.length < this.data.length) {
			this.length++;
			this.element.insertAdjacentHTML('beforeend', this.clone.replace(this.pattern, '$1' + this.attribute.path + '.' + (this.length-1) + '$6'));
			this.view.addOne(this.element.lastChild, true);
			this.view.add(this.element.lastChild.getElementsByTagName('*'), true);
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
		this.view.add(this.element.getElementsByTagName('*'), true);
	},
	css: function () {
		var css = this.data;
		if (this.attribute.cmds.length > 1) css = this.attribute.cmds.slice(1).join('-') + ': ' +  css + ';';
		this.element.style.cssText += css;
		// if (this.attribute.cmds.length > 1) this.data = this.attribute.cmds.slice(1).join('-') + ': ' +  this.data + ';';
		// this.element.style.cssText += this.data;
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
		var path = Utility.toCamelCase(this.attribute.cmds);
		Utility.setByPath(this.element, path, this.data);
	}
};
