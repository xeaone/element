// import Traverse from '../utility/traverse.js';

const submit = async function (binder, event) {

    event.preventDefault();

    const data = {};
    const elements = event.target.querySelectorAll('*');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];

        if (
            !element.type && element.nodeName !== 'TEXTAREA' ||
            element.type === 'submit' ||
            element.type === 'button' ||
            !element.type
        ) {
            continue;
        }

        const b = this.get(element, 'o-value');

        const value = (
            b ? b.data : (
                element.files ? (
                    element.attributes['multiple'] ? Array.prototype.slice.call(element.files) : element.files[0]
                ) : element.value
            )
        );

        const name = element.name || (b ? b.values[b.values.length - 1] : null);

        if (!name) continue;
        data[name] = value;

    }

    let method = binder.data;
    if (typeof method === 'function') {
        await method.call(binder.container, data, event);
    }

    if ('o-reset' in event.target.attributes) {
        event.target.reset();
    }

};

export default function (binder) {
    const self = this;
    let data;
    return {
        read () {
            data = binder.data;

            if (typeof data !== 'function') {
                return console.warn(`Oxe - binder ${binder.name}="${binder.value}" invalid type function required`);
            }

            if (binder.meta.method) {
                binder.target.removeEventListener('submit', binder.meta.method);
            }

            // binder.meta.method = function (events) {
            //     const parameters = [];
            //
            //     for (let i = 0, l = binder.pipes.length; i < l; i++) {
            //         const keys = binder.pipes[i].split('.');
            //         const parameter = Traverse(binder.container.model, keys);
            //         parameters.push(parameter);
            //     }
            //
            //     parameters.push(events);
            //     parameters.push(this);
            //
            //     Promise.resolve(data.bind(binder.container).apply(null, parameters)).catch(console.error);
            // };

            binder.meta.method = submit.bind(self, binder);
            binder.target.addEventListener('submit', binder.meta.method);
        }
    };
}
