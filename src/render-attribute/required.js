import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);

			if (binder.element.required === data) {
				return false;
			}

			data = Binder.piper(binder, data);
		},
		write () {
			binder.element.required = data;
		}
	};
}
