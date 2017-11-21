
export default function (opt, caller) {
	var i , l, data, query, element, elements;

	data = this.getData(opt);

	if (opt.element.type === 'checkbox') {

		if (caller === 'view') {
			data = opt.element.value = opt.element.checked;
		} else {
			data = !data ? false : data;
			opt.element.value = data;
			opt.element.checked = data;
		}

		this.setData(opt, data);

	} else if (opt.element.nodeName === 'SELECT') {

		elements = opt.element.options;
		data = !data && opt.element.multiple ? [] : data;
		data = caller === 'view' && opt.element.multiple ? [] : data;

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];

			if (element.selected) {

				if (opt.element.multiple) {
					data.push(element.value);
				} else {
					data = element.value;
					break;
				}

			}

		}

		this.setData(opt, data);

	} else if (opt.element.type === 'radio') {

		query = 'input[type="radio"][o-value="' + opt.value + '"]';
		elements = opt.container.querySelectorAll(query);
		data = !data ? 0 : data;

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];

			if (caller === 'view') {

				if (opt.element === element) {
					data = i;
					element.checked = true;
					this.setData(opt, data);
				} else {
					element.checked = false;
				}

			} else {
				element.checked = i == data;
			}

		}

	} else {

		data = data === undefined ? '' : data;

		if (caller === 'view') {
			data = opt.element.value;
		} else {
			opt.element.value = data;
		}

		this.setData(opt, data);

	}

}
