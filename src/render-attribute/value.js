import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	const self = this;
	const type = binder.element.type;
	const name = binder.element.nodeName;

	let data, multiple;

	if (name === 'SELECT') {
		let elements;

		return {
			read () {
				data = Model.get(binder.keys);
				elements = binder.element.options;
				multiple = binder.element.multiple;

				if (multiple) return false;

				// if (multiple && data.constructor !== Array) {
				// 	throw new Error(`Oxe - invalid multiple select value type ${binder.keys.join('.')} array required`);
				// }

			},
			write () {
				let index = 0;
				let selected = false;

				// NOTE might need to handle disable
				for (let i = 0, l = elements.length; i < l; i++) {
					const element = elements[i];

					if (element.value === data) {
						selected = true;
						element.setAttribute('selected', '');
					} else if (element.hasAttribute('selected')) {
						index = i;
						element.removeAttribute('selected');
					} else {
						element.removeAttribute('selected');
					}
				}

				if (elements.length && !selected) {
					elements[index].setAttribute('selected', '');
					if (data !== (elements[index].value || '')) {
						Model.set(binder.keys, elements[index].value || '');
					}
				}

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

				if (typeof data !== 'boolean') {
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

				if (name === 'OPTION' && binder.element.selected) {
					const parent = binder.element.parentElement;
					const select = Binder.elements.get(parent).get('value');
					self.default(select);
				}

				data = Model.get(binder.keys);

				if (data === undefined || data === null) {
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
