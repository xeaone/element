import Utility from '../utility.js';

export default function (binder) {
    return {
        read (context) {
            context.data = binder.data;

            if (typeof context.data !== 'function') {
                console.warn(`Oxe - binder o-on="${binder.keys.join('.')}" invalid type function required`);
                return;
            }

            if (binder.meta.method) {
                binder.target.removeEventListener(binder.names[1], binder.meta.method);
            } else {
                binder.meta.method = function (events) {
                    const parameters = [ events ];

                    for (let i = 0, l = binder.pipes.length; i < l; i++) {
                        const keys = binder.pipes[i].split('.');
                        const parameter = Utility.getByPath(binder.container.model, keys);
                        parameters.push(parameter);
                    }

                    Promise.resolve(context.data.bind(binder.container).apply(null, parameters));
                };
            }

            binder.target.addEventListener(binder.names[1], binder.meta.method);
        }
    };
}
