import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	var data;

	return {
		read () {
			data = Model.get(binder.keys);
			data = Binder.piper(binder, data);

			if (binder.names.length > 1) {
				data = binder.names.slice(1).join('-') + ': ' +  data + ';';
			}

			if (data === binder.element.style.cssText) {
				return false;
			}

		},
		write () {
			binder.element.style.cssText = data;
		}
	};
};
