import Observer from './observer';
import Utility from './utility';
import INDEX from './index';

export default function Model (options) {
	this.isRan = false;
	this.setup(options);
}

Model.prototype.setup = function (options) {
	options = options || {};
	this.data = options.data || {};
	this.handler = options.handler;
	this.container = options.container || document.body;
	return this;
};

Model.prototype.overwrite = function (data) {
	Observer(
		this.data = data,
		this.handler
	);
};

Model.prototype.inputListener = function (element) {
	var value = element.getAttribute('u-value');
	if (value) {
		var i, l;
		var path = value.replace(/(^(\w+\.?)+).*/, '$1');
		var uid = Utility.getContainer(element).uid;

		if (element.type === 'checkbox') {
			element.value = element.checked;
			Utility.setByPath(this.data[uid], path, element.checked);
		} else if (element.nodeName === 'SELECT' && element.multiple) {
			var values = [];
			var options = element.options;
			for (i = 0, l = options.length; i < l; i++) {
				var option = options[i];
				if (option.selected) {
					values.push(option.value);
				}
			}
			Utility.setByPath(this.data[uid], path, values);
		} else if (element.type === 'radio') {
			var elements = element.parentNode.querySelectorAll('input[type="radio"][u-value="' + path + '"]');
			for (i = 0, l = elements.length; i < l; i++) {
				var radio = elements[i];
				if (radio === element) {
					Utility.setByPath(this.data[uid], path, i);
				} else {
					radio.checked = false;
				}
			}
		} else {
			Utility.setByPath(this.data[uid], path, element.value);
		}
	}
};

Model.prototype.input = function (e) {
	if (e.target.type !== 'checkbox' && e.target.type !== 'radio' && e.target.nodeName !== 'SELECT') {
		this.inputListener.call(this, e.target);
	}
};

Model.prototype.change = function (e) {
	this.inputListener.call(this, e.target);
};

Model.prototype.run = function () {
	var self = this;

	if (self.isRan) return;
	else self.isRan = true;

	Observer(
		self.data,
		self.handler
	);

	INDEX._.inputs.push(this.input.bind(this));
	INDEX._.changes.push(this.change.bind(this));
};
