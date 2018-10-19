import Batcher from '../batcher.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {

	if (binder.type in this) {
		const render = this[binder.type](binder);

		if (render) {
			render.context = render.context || {};
			Batcher.batch(render);
		}

	} else {
		let data;

		Batcher.batch({
			read () {
				data = Model.get(binder.keys);

				if (binder.element[binder.type] === data) {
					return;
				}

				data = Binder.piper(binder, data);
			},
			write () {
				binder.element[binder.type] = data;
			}
		});
	}

};
