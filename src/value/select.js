import Model from '../model.js';

let data;

export default function (opt) {
	let selected = false;

	console.log('value select');

	data = Model.get(binder.keys);

	if (binder.element.multiple && data.constructor !== Array) {
		throw new Error(`Oxe - invalid multiple select value type ${binder.keys.join('.')} array required`);
	}

	// NOTE might need to handle disable
	for (let i = 0; i < binder.element.options.length; i++) {
		const element = binder.element.options[i];
		const value = data && data.constructor === Array ? data[i] : data;

		if (value && element.value === value) {
			element.setAttribute('selected', '');
			element.value = value;
			selected = true;
		} else {
			element.removeAttribute('selected');
		}

	}

	if (binder.element.options.length && !binder.element.multiple && !selected) {
		const value = data && data.constructor === Array ? data[0] : data;

		binder.element.options[0].setAttribute('selected', '');

		if (value !== (binder.element.options[0].value || '')) {
			Model.set(binder.keys, binder.element.options[0].value || '');
		}

	}

}
