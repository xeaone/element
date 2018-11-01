import Model from '../model.js';
import Binder from '../binder.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);
			if (!data === binder.element.disabled) return false;
		},
		write () {
			binder.element.disabled = !data;
		}
	};
}
