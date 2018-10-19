import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		write () {
			let data = Model.get(binder.keys);
			let name = binder.names.slice(1).join('-');
			data = Binder.piper(binder, data);
			binder.element.classList.toggle(name, data);
		}
	};
};
