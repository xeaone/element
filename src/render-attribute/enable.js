import Model from '../model.js';
import Binder from '../binder.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);

			if (binder.element.disabled === !data) return false;

			data = Binder.piper(binder, data);
			
			if (binder.element.disabled === !data) return false;
		},
		write () {
			binder.element.disabled = !data;
		}
	};
}
