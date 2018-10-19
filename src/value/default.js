import Model from '../model.js';

let data;

export default function (binder) {

	console.log('default');

	data = Model.get(binder.keys);
	binder.element.value = data === undefined ? '' : data;

	if (data !== binder.element.value) {
		Model.set(binder.keys, data === undefined ? '' : data);
	}

}
