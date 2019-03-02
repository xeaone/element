import Batcher from '../batcher.js';

export default function (binder, data) {
	let render;

	if (binder.type in this) {
		render = this[binder.type](binder, data);
	} else {
		render = {
			read () {

				if (data === undefined || data === null) {
					return false;
				} else if (typeof data === 'object') {
					data = JSON.stringify(data);
				} else if (typeof data !== 'string') {
					data = data.toString();
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

	if (render) {
		Batcher.batch(render);
	}

};
