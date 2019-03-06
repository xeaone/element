import Model from '../model.js';

export default function (binder, data) {
	return {
		read () {

			if (typeof data !== 'function') {
				console.warn(`Oxe - binder o-on="${binder.keys.join('.')}" invalid type function required`);
				return false;
			}

			if (!binder.cache.method) {
				binder.cache.method = function (e) {
					const parameters = [e];

					for (let i = 0, l = binder.pipes.length; i < l; i++) {
						const keys = binder.pipes[i].split('.');
						keys.unshift(binder.scope);
						const parameter = Model.get(keys);
						parameters.push(parameter);
					}

					Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);
				};
			}

		},
		write () {
			binder.element.removeEventListener(binder.names[1], binder.cache.method);
			binder.element.addEventListener(binder.names[1], binder.cache.method);
		}
	};
};
