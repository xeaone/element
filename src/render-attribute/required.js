import Utility from '../utility.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		read () {
			data = Model.get(binder.keys);

			if (binder.element.required === data) {
				return;
			}

			data = Utility.binderModifyData(binder, data);
		},
		write () {
			binder.element.required = data;
		}
	};
}
