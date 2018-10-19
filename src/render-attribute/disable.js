import Model from '../model.js';

export default function (binder) {
	let data;
	
	return {
		read () {
			data = Model.get(binder.keys);

			if (binder.element.disabled === data) {
				return;
			}

			data = Binder.piper(binder, data);
		},
		write () {
			binder.element.disabled = data;
		}
	};
};
