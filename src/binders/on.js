import Model from '../model.js';

export default function (binder, data) {
	return {
		read () {

			if (typeof data !== 'function') {
				console.warn(`Oxe - binder o-on="${binder.keys.join('.')}" invalid type function required`);
				return false;
			}

			if (!binder.meta.method) {
				binder.meta.method = function (events) {
					const parameters = [events];

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
			binder.target.removeEventListener(binder.names[1], binder.meta.method);
			binder.target.addEventListener(binder.names[1], binder.meta.method);
		}
	};
};
