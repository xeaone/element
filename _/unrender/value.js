
export default function (opt) {
	var i , l, query, element, elements;

	if (opt.element.type === 'checkbox') {

		opt.element.checked = false
		opt.element.value = false;

	} else if (opt.element.nodeName === 'SELECT') {

		elements = opt.element.options;

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];
			element.selected = false;
		}

	} else if (opt.element.type === 'radio') {

		query = 'input[type="radio"][o-value="' + opt.path + '"]';
		elements = opt.element.parentNode.querySelectorAll(query);

		for (i = 0, l = elements.length; i < l; i++) {
			element = elements[i];

			if (i === 0) {
				element.checked = true;
			} else {
				element.checked = false;
			}

		}

	} else {
		opt.element.value = '';
	}

}
