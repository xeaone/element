
export default function (binder) {
	return {
		write () {
			let i , l, query, element, elements;

			if (binder.element.nodeName === 'SELECT') {

				elements = binder.element.options;

				for (i = 0, l = elements.length; i < l; i++) {
					element = elements[i];
					element.selected = false;
				}

			} else if (binder.element.type === 'radio') {

				query = 'input[type="radio"][o-value="' + binder.path + '"]';
				elements = binder.element.parentNode.querySelectorAll(query);

				for (i = 0, l = elements.length; i < l; i++) {
					element = elements[i];

					if (i === 0) {
						element.checked = true;
					} else {
						element.checked = false;
					}

				}

			} else if (binder.element.type === 'checkbox') {

				binder.element.checked = false
				binder.element.value = false;

			} else {
				binder.element.value = '';
			}

		}
	};
};
