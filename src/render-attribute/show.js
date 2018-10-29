import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);

			if (!data === binder.element.hidden) {
				return false;
			}

			data = Binder.piper(binder, data);
		},
		write () {
			binder.element.hidden = !data;
		}
	};
};