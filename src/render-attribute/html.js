import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);

			if (data === undefined || data === null) {
				return false;
			} else if (typeof data === 'object') {
				data = JSON.stringify(data);
			} else if (typeof data !== 'string') {
				data = String(data);
			}

			if (data === binder.element.innerHTML) {
				return false;
			}

		},
		write () {
			binder.element.innerHTML = data;
		}
	};
};
