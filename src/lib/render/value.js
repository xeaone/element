import Global from '../../global.js';

export default function (opt, data) {
	var i , l;

	if (opt.element.type === 'checkbox') {

		data = !data ? false : data;

		if (opt.caller === 'view') {
			data = opt.element.checked;
			opt.element.value = data;
		} else {
			opt.element.checked = data;
			opt.element.value = data;
		}

	} else if (opt.element.nodeName === 'SELECT') {
		var options = opt.element.options;

		data = !data && opt.element.multiple ? [] : data;

		if (opt.caller === 'view' && opt.element.multiple) {
			data = [];
		}

		for (i = 0, l = options.length; i < l; i++) {
			var option = options[i];

			if (option.selected) {

				if (opt.element.multiple) {
					data.push(option.value);
				} else {
					data = option.value;
					break;
				}

			}

		}

	} else if (opt.element.type === 'radio') {
		var query = 'input[type="radio"][o-value="' + opt.value + '"]';
		var elements = opt.container.querySelectorAll(query);

		data = !data ? 0 : data;

		for (i = 0, l = elements.length; i < l; i++) {
			var element = elements[i];

			if (opt.caller === 'view') {

				if (opt.element === element) {
					data = i;
					element.checked = true;
				} else {
					element.checked = false;
				}

			} else {
				element.checked = i == data;
			}

		}

	} else {

		// TODO find a way to update other inputs
		if (data === undefined) {
			opt.element.value = data = '';
		} else if (opt.element.value === '') {
			opt.element.value = data;
		} else {
			data = opt.element.value;
		}

	}

	// FIXME this should not return data every time
	return data;
}
