import Model from './model.js';
import Binder from './binder.js';
import Batcher from './batcher.js';

export default async function (element, attribute) {

	if (!element) throw new Error('Oxe - requires element argument');
	if (!attribute) throw new Error('Oxe - requires attribute argument');

	let binder = Binder.elements.get(element).get(attribute);

	let read = function () {
		let type = binder.element.type;
	 	let name = binder.element.nodeName;

		let data;

		if (name === 'SELECT') {
			let elements = binder.element.options;
			let multiple = binder.element.multiple;

			let selected = false;

			data = multiple ? [] : '';

			for (let i = 0, l = elements.length; i < l; i++) {
				let element = elements[i];
				// NOTE might need to handle disable

				if (element.selected) {
					selected = true;

					if (multiple) {
						data.push(element.value);
					} else {
						data = element.value;
						break;
					}

				}

			}

			if (elements.length && !multiple && !selected) {
				data = elements[0].value;
			}

		} else if (type === 'radio') {
			let query = 'input[type="radio"][o-value="' + binder.value + '"]';
			let elements = binder.container.querySelectorAll(query);

			for (let i = 0, l = elements.length; i < l; i++) {
				let element = elements[i];

				if (binder.element === element) {
					data = i;
				}

			}

		} else if (type === 'file') {
			let files = binder.element.files;

			data = data || [];

			for (let i = 0, l = files.length; i < l; i++) {
				let file = files[i];
				data.push(file);
			}

		} else if (type === 'checkbox') {
			data = binder.element.checked;
		} else {
			data = binder.element.value;
		}

		if (data !== undefined) {
			let original = Model.get(binder.keys);

			if (
				data &&
				typeof data === 'object' &&
				data.constructor === original.constructor
			) {
				for (let key in data) {
					if (data[key] !== original[key]) {
						Model.set(binder.keys, data);
						break;
					}
				}
			} else if (original !== data) {
				Model.set(binder.keys, data);
			}

		}

	};

	Batcher.batch({ read });
};
