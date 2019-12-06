import Traverse from '../utility/traverse.js';

export default function (binder) {
    let data;
    return {
        read () {
            data = binder.data;

            if (typeof data !== 'function') {
                console.warn(`Oxe - binder ${binder.name}="${binder.value}" invalid type function required`);
                return;
            }

            if (binder.meta.method) {
                binder.target.removeEventListener(binder.names[1], binder.meta.method);
            }

            binder.meta.method = function (events) {
                const parameters = [];

                for (let i = 0, l = binder.pipes.length; i < l; i++) {
                    const path = binder.pipes[i];
                    const parameter = Traverse(binder.container.model, path);
                    parameters.push(parameter);
                }

                parameters.push(events);
                // parameters.push(this);

                Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);
            };

            binder.target.addEventListener(binder.names[1], binder.meta.method);
        }
    };
}
