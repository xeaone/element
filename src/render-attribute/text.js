import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);

			if (data === undefined) {
				Model.set(binder.keys, '');
				return false;
			} else if (data === null) {
				return false;
			} else if (data && typeof data === 'object') {
				data = JSON.stringify(data);
			} else if (data && typeof data !== 'string') {
				data = String(data);
			}

			data = Binder.piper(binder, data);
		},
		write () {
			binder.element.innerText = data;
		}
	};
};
