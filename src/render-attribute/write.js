import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);

			if (binder.element.readOnly === !data) {
				return;
			}

			data = Binder.piper(binder, data);
		},
		write () {
			binder.element.readOnly = !data;
		}
	};
};
