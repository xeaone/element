import Batcher from '../batcher.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let render;
	let data;

	if (binder.type in this) {
		render = this[binder.type](binder);
	} else {
		render = {
			read () {
				data = Model.get(binder.keys);
				data = Binder.piper(binder, data);

				if (data === undefined || data === null) {
					Model.set(binder.keys, '');
					return false;
				} else if (typeof data === 'object') {
					data = JSON.stringify(data);
				} else if (typeof data !== 'string') {
					data = String(data);
				}

				if (data === binder.element[binder.type]) {
					return false;
				}

			},
			write () {
				binder.element[binder.type] = data;
			}
		};
	}

	Batcher.batch(render);
};
