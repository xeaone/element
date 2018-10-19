import Default from '../value/default.js';
import Select from '../value/select.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			const type = binder.element.type;
			const name = binder.element.nodeName;

			if (name === 'SELECT') {
				return Select(binder);
			} else if (type === 'radio') {
				const query = 'input[type="radio"][o-value="' + binder.value + '"]';
				const elements = binder.container.querySelectorAll(query);

				let checked = false;

				for (let i = 0, l = elements.length; i < l; i++) {
					const element = elements[i];

					if (i === data) {
						checked = true;
						element.checked = true;
					} else {
						element.checked = false;
					}

				}

				if (!checked) {
					elements[0].checked = true;
					if (data !== 0) {
						Model.set(binder.keys, 0);
					}
				}

			} else if (type === 'file') {
				data = data || [];

				for (let i = 0, l = data.length; i < l; i++) {

					if (data[i] !== binder.element.files[i]) {

						if (data[i]) {
							binder.element.files[i] = data[i];
						} else {
							console.warn('Oxe - file remove not implemented');
						}

					}

				}

			} else if (type === 'checkbox') {
				binder.element.checked = data === undefined ? false : data;

				if (data !== binder.element.checked) {
					Model.set(binder.keys, data === undefined ? false : data);
				}

			} else {
				return Default(binder);
			}
		}
	};
};
