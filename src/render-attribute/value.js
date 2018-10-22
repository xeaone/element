import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data, multiple;

	const type = binder.element.type;
	const name = binder.element.nodeName;

	if (name === 'SELECT') {
		let elements;

		return {
			read () {
				data = Model.get(binder.keys);
				elements = binder.element.options;
				multiple = binder.element.multiple;

				if (multiple && data.constructor !== Array) {
					throw new Error(`Oxe - invalid multiple select value type ${binder.keys.join('.')} array required`);
				}

			},
			write () {
				let selected = false;

				// NOTE might need to handle disable
				for (let i = 0; i < elements.length; i++) {
					const element = elements[i];
					const value = data && data.constructor === Array ? data[i] : data;

					if (value && element.value === value) {
						selected = true;
						element.value = value;
						element.setAttribute('selected', '');
					} else {
						element.value = false;
						element.removeAttribute('selected');
					}

				}

				if (elements.length && !multiple && !selected) {
					const value = data && data.constructor === Array ? data[0] : data;

					elements[0].setAttribute('selected', '');

					if (value !== (elements[0].value || '')) {
						// Model.set(binder.keys, elements[0].value || '');
					}

				}

				// if (binder.element.options.length && !binder.element.multiple && !selected) {
				// 	const value = data && data.constructor === Array ? data[0] : data;
				//
				// 	binder.element.options[0].setAttribute('selected', '');
				//
				// 	if (value !== (binder.element.options[0].value || '')) {
				// 		Model.set(binder.keys, binder.element.options[0].value || '');
				// 	}
				//
				// }

			}
		};
	} else if (type === 'radio') {
		let elements;

		return {
			read () {
				data = Model.get(binder.keys);

				if (data === undefined) {
					Model.set(binder.keys, 0);
					return false;
				}

				elements = binder.container.querySelectorAll(
					'input[type="radio"][o-value="' + binder.value + '"]'
				);
			},
			write () {
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
					Model.set(binder.keys, 0);
				}

			}
		};
	} else if (type === 'file') {
		return {
			read () {
				data = Model.get(binder.keys);

				if (data === undefined) {
					Model.set(binder.keys, []);
					return false;
				}

				if (!data || data.constructor !== Array) {
					console.warn('Oxe - file attribute invalid type');
					return false;
				}
			},
			write () {
				for (let i = 0, l = data.length; i < l; i++) {
					if (data[i] !== binder.element.files[i]) {
						if (data[i]) {
							binder.element.files[i] = data[i];
						} else {
							console.warn('Oxe - file remove not implemented');
						}
					}
				}
			}
		};
	} else if (type === 'checkbox') {
		return {
			read () {
				data = Model.get(binder.keys);

				if (data === undefined) {
					Model.set(binder.keys, false);
					return false;
				}

				if (data === binder.element.checked) {
					return false;
				}

			},
			write () {
				binder.element.checked = data;
			}
		};
	} else {
		return {
			read () {
				data = Model.get(binder.keys);

				if (data === undefined) {
					Model.set(binder.keys, '');
					return false;
				}

				if (data === binder.element.value) {
					return false;
				}

			},
			write () {
				binder.element.value = data;
			}
		};
	}
};
