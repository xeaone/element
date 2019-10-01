
const submit = async function (binder, event) {

    event.preventDefault();

    const data = {};
    const elements = event.target.querySelectorAll('*');

    for (let i = 0, l = elements.length; i < l; i++) {
        const element = elements[i];
        const type = element.type;

        if (
            !type && name !== 'TEXTAREA' ||
            type === 'submit' ||
            type === 'button' ||
            !type
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
    if (binder.meta.method) {
        binder.target.removeEventListener('submit', binder.meta.method, false);
    } else {
        binder.meta.method = submit.bind(this, binder);
        binder.target.addEventListener('submit', binder.meta.method, false);
    }
}
