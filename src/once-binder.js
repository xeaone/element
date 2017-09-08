import Utility from './utility';

export default {
	bind: function (element, attribute, container) {
		var model = container.model;
		var type = attribute.cmds[0];
		var key = attribute.path.split('.').pop();
		var data = Utility.getByPath(model, attribute.path);
		var updateModel = data === undefined;
		data = this.type[type](element, attribute, model, data);
		if (updateModel) data = model.$set(key, data);
	},
	type: {
		value: function (element, attribute, model, data) {
			var i, l;
			
			if (element.type === 'checkbox') {
				if (element.checked !== data) {
					data = !data ? false : data;
					element.value = element.checked = data;
				}
			} else if (element.nodeName === 'SELECT' && element.multiple) {
				if (element.options.length !== data.length) {
					var options = element.options;
					for (i = 0, l = options.length; i < l; i++) {
						var option = options[i];
						if (option.value === data[i]) {
							option.selected;
						}
					}
				}
			} else if (element.type === 'radio') {
				var elements = element.parentNode.querySelectorAll('input[type="radio"][type="radio"][j-value="' + attribute.value + '"]');
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
