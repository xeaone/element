import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data, name;

	return {
		write () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);
			name = binder.names.slice(1).join('-');
			binder.element.classList.toggle(name, data);
		}
	};
};
