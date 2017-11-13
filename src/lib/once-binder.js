import Utility from './utility';
import Global from '../global';

var OnceBinder = {};

OnceBinder.bind = function (element, attribute, container) {

	if (
		!container.model ||
		!this.type[attribute.cmds[0]]
	) return;

	var data = {};
	var type = attribute.cmds[0];
	var key = attribute.parentKey;

	data.element = element;
	data.attribute = attribute;
	data.container = container;

	data.model = attribute.parentPath ? Utility.getByPath(container.model, attribute.parentPath) : container.model;
	data.value = data.model[key];

	var value = this.type[type].call(this, data);

	if (value) {
		data.model[key] = value;
		// data.model.$set(key, value);
		// if (model[key] === undefined) {
		// } else if (value.constructor === Array) {
		// 	// FIXME selects not setting defaults
		// 	model[key].push.apply(null, value);
		// }
	}

};

OnceBinder.kind = {
	checkbox: function (data) {
		data.value = !data.value ? false : data.value;
		data.element.value = data.element.checked = data.value;
		return data.value;
	},
	select: function (data) {
		var options = data.element.options;

		data.value = data.element.multiple ? [] : data.value;

		for (var i = 0, l = options.length; i < l; i++) {
			var option = options[i];
			if (option.selected) {
				if (data.element.multiple) {
					data.value.push(option.value);
				} else {
					data.value = option.value;
					break;
				}
			}
		}

		return data.value;
	},
	radio: function (data) {
		var query = 'input[type="radio"][o-value="' + data.attribute.value + '"]';
		var elements = data.element.parentNode.querySelectorAll(query);

		for (var i = 0, l = elements.length; i < l; i++) {
			var radio = elements[i];
			radio.checked = i === data.value;
		}

		return data.value;
	},
	default: function (data) {
		data.value = data.value === undefined ? '' : data.value;
		data.element.value = data.value;
		return data.value;
	},
};

OnceBinder.type = {
	value: function (data) {
		var kind;

		if (data.element.type === 'checkbox') {
			kind = 'checkbox';
		} else if (data.element.nodeName === 'SELECT') {
			kind = 'select';
		} else if (data.element.type === 'radio') {
			kind = 'radio';
		} else {
			kind = 'default';
		}

		return this.kind[kind].call(this, data);
	}

};

export default OnceBinder;
