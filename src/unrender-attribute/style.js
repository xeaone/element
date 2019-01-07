import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);
		},
		write () {
			if (!data) {
				return;
			} else if (data.constructor === Object) {
				for (const name in data) {
					delete binder.element.style[name];
				}
			}
		}
	};
};
