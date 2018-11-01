import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);
			if (data === binder.element.readOnly) return false;
		},
		write () {
			binder.element.readOnly = data;
		}
	};
};
