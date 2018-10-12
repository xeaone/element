import Model from './model.js';
import Binder from './binder.js';
import Batcher from './batcher.js';

export default async function (element, attribute) {

	if (!element) throw new Error('Oxe - requires element argument');
	if (!attribute) throw new Error('Oxe - requires attribute argument');

	const binder = Binder.elements.get(element).get(attribute);

	Batcher.read(function () {
		const type = binder.element.type;
	 	const name = binder.element.nodeName;

		let data;

		if (name === 'SELECT') {
			const elements = binder.element.options;
			const multiple = binder.element.multiple;

			let selected = false;

			data = multiple ? [] : '';

			for (const element of elements) {
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
			const query = 'input[type="radio"][o-value="' + binder.value + '"]';
			const elements = binder.container.querySelectorAll(query);

			for (let i = 0, l = elements.length; i < l; i++) {
				const element = elements[i];

				if (binder.element === element) {
					data = i;
				}

			}

		} else if (type === 'file') {
			const files = binder.element.files;

			data = data || [];

			for (const file of files) {
				data.push(file);
			}

		} else if (type === 'checkbox') {
			data = binder.element.checked;
		} else {
			data = binder.element.value;
		}

		if (data !== undefined) {
			const original = Model.get(binder.keys);

			if (
				data &&
				typeof data === 'object' &&
				data.constructor === original.constructor
			) {
				for (const key in data) {
					if (data[key] !== original[key]) {
						Model.set(binder.keys, data);
						break;
					}
				}
			} else if (original !== data) {
				Model.set(binder.keys, data);
			}

		}

	});
};
