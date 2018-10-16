import Model from '../model.js';

export default function (binder) {

	console.log('default');

	binder.data = Model.get(binder.keys);
	binder.element.value = binder.data === undefined ? '' : binder.data;

	if (binder.data !== binder.element.value) {
		Model.set(binder.keys, binder.data === undefined ? '' : binder.data);
	}

}
