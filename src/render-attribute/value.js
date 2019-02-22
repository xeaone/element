import Utility from '../utility.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let self = this;
	let type = binder.element.type;
	let name = binder.element.nodeName;

	let data;

	if (name.indexOf('SELECT') !== -1) {
		let elements, multiple;

		return {
			read () {
				data = Model.get(binder.keys);
				data = Binder.piper(binder, data);

				elements = binder.element.options || binder.element.children;
				multiple = Utility.multiple(binder.element);

				if (multiple && data.constructor !== Array) {
					throw new Error(`Oxe - invalid multiple select value type ${binder.keys.join('.')} array required`);
				}

			},
			write () {
				let selected = false;

				if (multiple) {
					var original = Model.get(binder.keys);
					// original.length = 0;
					original.splice(0, original.length);
				}

				// NOTE might need to handle disable
				for (let i = 0, l = elements.length; i < l; i++) {
					const element = elements[i];
					const value = Utility.value(element);

					if (multiple) {
						if (data.indexOf(value) !== -1) {
							selected = true;
							element.selected = true;
							element.setAttribute('selected', '');
						} else if (Utility.selected(element)) {
							Model.get(binder.keys).push(value);
						} else {
							element.selected = false;
							element.removeAttribute('selected');
						}
					} else {
						if (data === value) {
							selected = true;
							element.selected = true;
							element.setAttribute('selected', '');
						} else if (!selected && Utility.selected(element)) {
							selected = true;
							Model.set(binder.keys, value);
						} else {
							element.selected = false;
							element.removeAttribute('selected');
						}
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
					let element = elements[i];

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

				// if (name === 'OPTION' && binder.element.selected) {
				if (name.indexOf('OPTION') !== -1 && binder.element.selected) {
					let parent = binder.element.parentElement;
					let select = Binder.elements.get(parent).get('value');
					self.default(select);
				}

				data = Model.get(binder.keys);

				if (data === undefined || data === null) {
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
