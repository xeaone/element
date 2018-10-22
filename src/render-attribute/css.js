import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);

			if (binder.element.style.cssText === data) return false;

			if (binder.names.length > 1) {
				data = binder.names.slice(1).join('-') + ': ' +  data + ';';
			}

			data = Binder.piper(binder, data);
			
			if (binder.element.style.cssText === data) return false;
		},
		write () {
			binder.element.style.cssText = data;
		}
	};
};
