import Model from '../model.js';

export default function (opt) {
	let selected = false;
	
	console.log('select');

	binder.data = Model.get(binder.keys);

	if (binder.element.multiple && binder.data.constructor !== Array) {
		throw new Error(`Oxe - invalid multiple select value type ${binder.keys.join('.')} array required`);
	}

	// NOTE might need to handle disable
	for (let i = 0; i < binder.element.options.length; i++) {
		const element = binder.element.options[i];
		const value = binder.data && binder.data.constructor === Array ? binder.data[i] : binder.data;

		if (value && element.value === value) {
			element.setAttribute('selected', '');
			element.value = value;
			selected = true;
		} else {
			element.removeAttribute('selected');
		}

	}

	if (binder.element.options.length && !binder.element.multiple && !selected) {
		const value = binder.data && binder.data.constructor === Array ? binder.data[0] : binder.data;

		binder.element.options[0].setAttribute('selected', '');

		if (value !== (binder.element.options[0].value || '')) {
			Model.set(binder.keys, binder.element.options[0].value || '');
		}

	}

}
