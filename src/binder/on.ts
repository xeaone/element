
const submit = async function (event, binder) {
    event.preventDefault();
    const { target } = event;

    const data = {};
    const elements = [ ...target.querySelectorAll('*') ];
    for (const element of elements) {
        const { type, name, nodeName, checked } = element;

        if (!name) continue;

        if (
            (!type && nodeName !== 'TEXTAREA') ||
            type === 'submit' || type === 'button' || !type
        ) continue;

        // if (type === 'checkbox' && !checked) continue;
        if (type === 'radio' && !checked) continue;

        const attribute = element.getAttributeNode('value');
        const valueBinder = binder.get(attribute);
        const value = valueBinder ? await valueBinder.compute() : attribute.value;

        console.warn('todo: need to get a value for selects');

        // const value = (
        //     valueBinder ? valueBinder.data : (
        //         element.files ? (
        //             element.attributes[ 'multiple' ] ? Array.prototype.slice.call(element.files) : element.files[ 0 ]
        //         ) : element.value
        //     )
        // );

        // const name = element.name || (valueBinder ? valueBinder.values[ valueBinder.values.length - 1 ] : null);

        let meta = data;
        name.split(/\s*\.\s*/).forEach((part, index, parts) => {
            const next = parts[ index + 1 ];
            if (next) {
                if (!meta[ part ]) {
                    meta[ part ] = /[0-9]+/.test(next) ? [] : {};
                }
                meta = meta[ part ];
            } else {
                meta[ part ] = value;
            }
        });

    }

    const method = await binder.compute(binder.container);
    await method(event, data);

    if (target.getAttribute('reset')) target.reset();

    return false;
};

const reset = async function (event, binder) {
    event.preventDefault();
    const { target } = event;

    const elements = target.querySelectorAll('*');
    for (const element of elements) {
        const { type, nodeName } = element;

        if (
            (!type && nodeName !== 'TEXTAREA') ||
            type === 'submit' || type === 'button' || !type
        ) continue;

        // const value = binder.get(element)?.get('value');

        // if (!value) {
        if (type === 'select-one' || type === 'select-multiple') {
            element.selectedIndex = null;
        } else if (type === 'radio' || type === 'checkbox') {
            element.checked = false;
        } else {
            element.value = null;
        }
        // } else if (type === 'select-one') {
        //     value.data = null;
        // } else if (type === 'select-multiple') {
        //     value.data = [];
        // } else if (type === 'radio' || type === 'checkbox') {
        //     value.data = false;
        // } else {
        //     value.data = '';
        // }

    }

    return binder.compute(binder.container, event);
};

export default {
    async read (binder) {

        binder.target[ binder.name ] = null;
        const name = binder.name.slice(2);

        if (binder.meta.method) {
            binder.target.removeEventListener(name, binder.meta.method);
        }

        binder.meta.method = event => {
            if (name === 'reset') {
                return reset.call(binder.container, event, binder);
            } else if (name === 'submit') {
                return submit.call(binder.container, event, binder);
            } else {
                return binder.compute(binder.container, event);
            }
        };

        binder.target.addEventListener(name, binder.meta.method);
    }
};