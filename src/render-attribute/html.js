import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);

			if (binder.element.innerHTML === data) return false;

			data = Binder.piper(binder, data);

			if (binder.element.innerHTML === data) return false;

		},
		write () {
			binder.element.innerHTML = data;
		}
	};
};
