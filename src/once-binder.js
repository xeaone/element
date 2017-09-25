import Utility from './utility';

export default {
	bind: function (element, attribute, container) {
		var model = container.model;
		var type = attribute.cmds[0];
		var key = attribute.parentKey;
		var data = attribute.parentPath ? Utility.getByPath(model, attribute.parentPath) : model;
		var value = this.type[type](element, attribute, data[key]);

		if (data[key] === undefined) {
			data.$set(key, value);
		} else {
			// FIXME selects not setting defaults
			if (value.constructor === Array) {
				data[key].push.apply(null, value);
			}
		}
	},
	type: {
		value: function (element, attribute, data) {
			var i, l;
			if (element.type === 'checkbox') {
				data = !data ? false : data;
				element.value = element.checked = data;
			} else if (element.nodeName === 'SELECT') {
				data = element.multiple ? [] : data;
				var options = element.options;
				for (i = 0, l = options.length; i < l; i++) {
					var option = options[i];
					if (option.selected) {
						if (element.multiple) {
							data.push(option.value);
						} else {
							data = option.value;
							break;
						}
					}
				}
			} else if (element.type === 'radio') {
				var elements = element.parentNode.querySelectorAll('input[type="radio"][o-value="' + attribute.value + '"]');
				for (i = 0, l = elements.length; i < l; i++) {
					var radio = elements[i];
					radio.checked = i === data;
				}
			} else {
				element.value = data;
			}
			return data;
		}
	}
};
