import Methods from '../methods.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	let data;

	return {
		write () {
			data = Methods.get(binder.keys);

			if (typeof data !== 'function') return;

			if (binder.cache) {
				binder.element.removeEventListener(binder.names[1], binder.cache);
			} else {
				binder.cache = function (e) {
					const parameters = [e];

					for (let i = 0, l = binder.pipes.length; i < l; i++) {
						const keys = binder.pipes[i].split('.');
						keys.unshift(binder.scope);
						const parameter = Oxe.model.get(keys);
						parameters.push(parameter);
					}

					Promise.resolve()
					.then(data.bind(binder.container).apply(null, parameters))
					.catch(console.error);
				};
			}

			binder.element.addEventListener(binder.names[1], binder.cache);
		}
	};
};
