import Observer from './observer';
import Utility from './utility';

export default function Model (options) {
	this.isRan = false;
	this.setup(options);
}

Model.prototype.setup = function (options) {
	options = options || {};
	this.data = options.data || {};
	this.container = options.container || document.body;
};

Model.prototype.handler = function (callback) {
	this._handler = callback;
};

Model.prototype.overwrite = function (data) {
	Observer(
		this.data = data,
		this._handler
	);
};

Model.prototype.inputListener = function (element) {
	var value = element.getAttribute('j-value');
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
			var elements = element.parentNode.querySelectorAll('input[type="radio"][j-value="' + path + '"]');
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

Model.prototype.run = function () {
	if (this.isRan) return;
	else this.isRan = true;

	Observer(
		this.data,
		this._handler
	);

	this.container.addEventListener('change', function (e) {
		if ((e.target.type === 'checkbox' || e.target.type === 'radio') && e.target.nodeName !== 'SELECT') {
			this.inputListener.call(this, e.target);
		}
	}.bind(this), true);

	this.container.addEventListener('input', function (e) {
		this.inputListener.call(this, e.target);
	}.bind(this), true);
};
