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

				if (binder.element[binder.type] === data) {
					return;
				}

				data = Binder.piper(binder, data);
			},
			write () {
				binder.element[binder.type] = data;
			}
		};
	}

	Batcher.batch(render);
};
