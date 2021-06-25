
const submit = async function (event, binder) {
    event.preventDefault();
    const { target } = event;

    const form = {};
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

        let meta = form;
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

    await binder.compute({ form, event });

    if (target.getAttribute('reset')) target.reset();

    return false;
};

const reset = async function (event, binder) {
    event.preventDefault();
    const target = event.target;

    const elements = target.elements;
    for (let element of elements) {
        const { type, nodeName } = element;
        if (
            (!type && nodeName !== 'TEXTAREA') ||
            type === 'submit' || type === 'button' || !type
        ) continue;

        // const value = binder.get(element)?.get('value');

        if (type === 'select-one') {
            element.selectedIndex = 0;
        } else if (type === 'select-multiple') {
            element.selectedIndex = -1;
        } else if (type === 'radio' || type === 'checkbox') {
            element.checked = false;
        } else {
            element.value = undefined;
        }

        element.dispatchEvent(new Event('input'));
    }

    return binder.compute({ event });
};

const read = async function (binder) {

    binder.owner[ binder.name ] = null;
    const name = binder.name.slice(2);

    if (binder.meta.method) {
        binder.owner.removeEventListener(name, binder.meta.method);
    }

    binder.meta.method = event => {
        if (name === 'reset') {
            return reset(event, binder);
        } else if (name === 'submit') {
            return submit(event, binder);
        } else {
            return binder.compute({ event });
        }
    };

    binder.owner.addEventListener(name, binder.meta.method);
};

export default { read };