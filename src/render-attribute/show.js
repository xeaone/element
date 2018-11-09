import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	var data;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);
			if (!data === binder.element.hidden) return false;
		},
		write () {
			binder.element.hidden = !data;
		}
	};
};
