import Model from '../model.js';

export default function (binder, data) {
	return {
		write () {

			if (typeof data !== 'function') {
				console.warn(`Oxe - attribute o-on="${binder.keys.join('.')}" invalid type function required`);
				return false;
			}

			if (!binder.cache) {
				binder.cache = function (e) {
					let parameters = [e];

					for (let i = 0, l = binder.pipes.length; i < l; i++) {
						let keys = binder.pipes[i].split('.');
						keys.unshift(binder.scope);
						let parameter = Model.get(keys);
						parameters.push(parameter);
					}

					Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);
				};
			}

			binder.element.removeEventListener(binder.names[1], binder.cache);
			binder.element.addEventListener(binder.names[1], binder.cache);
		}
	};
};
