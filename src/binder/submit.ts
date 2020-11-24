import Binder from '../binder';

const submit = async function (binder, event) {
    event.preventDefault();

    const data = {};
    const elements = event.target.querySelectorAll('*');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];

        if (
            (!element.type && element.nodeName !== 'TEXTAREA') ||
            element.type === 'submit' ||
            element.type === 'button' ||
            !element.type
        ) continue;

        const attribute = element.attributes['o-value'];
        const b = Binder.get(attribute);

        console.warn('todo: need to get a value for selects');

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

    // if (typeof binder.data === 'function') {
    //     await binder.data.call(binder.container, data, event);
    // }

    const method = binder.data;
    if (typeof method === 'function') {
        await method.call(binder.container, data, event);
    }

    if (binder.getAttribute('reset')) {
        event.target.reset();
    }

};

export default function (binder) {

    binder.target.submit = null;

    if (typeof binder.data !== 'function') {
        console.warn(`Oxe - binder ${binder.name}="${binder.value}" invalid type function required`);
        return;
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

    binder.meta.method = submit.bind(this, binder);
    binder.target.addEventListener('submit', binder.meta.method);
}
