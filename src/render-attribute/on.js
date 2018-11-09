import Methods from '../methods.js';
import Binder from '../binder.js';
import Model from '../model.js';

export default function (binder) {
	var data;

	return {
		write () {
			data = Methods.get(binder.keys);

			if (typeof data !== 'function') {
				console.warn(`Oxe - attribute o-on="${binder.keys.join('.')}" invalid type function required`);
				return false;
			}

			if (!binder.cache) {
				binder.cache = function (e) {
					var parameters = [e];

					for (var i = 0, l = binder.pipes.length; i < l; i++) {
						var keys = binder.pipes[i].split('.');
						keys.unshift(binder.scope);
						var parameter = Model.get(keys);
						parameters.push(parameter);
					}

					Promise.resolve()
					.then(data.bind(binder.container).apply(null, parameters))
					.catch(console.error);
				};
			}

			binder.element.removeEventListener(binder.names[1], binder.cache);
			binder.element.addEventListener(binder.names[1], binder.cache);
		}
	};
};
