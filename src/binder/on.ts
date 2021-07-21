import numberTypes from '../types/number';

const getValue = (element) => {
    if (!element) return undefined;
    else if ('$value' in element) return typeof element.$value === 'object' ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
    else if (numberTypes.includes(element.type)) return element.valueAsNumber;
    else return element.value;
};

const submit = async function (event, binder) {
    event.preventDefault();

    const form = {};
    const target = event.target;
    const elements = target?.elements || target?.form?.elements;

    for (const element of elements) {
        const { type, name, nodeName, checked } = element;

        if (!name) continue;

        if (
            (!type && nodeName !== 'TEXTAREA') ||
            type === 'submit' || type === 'button' || !type
        ) continue;

        if (type === 'radio' && !checked) continue;
        if (type === 'checkbox' && !checked) continue;

        let value;
        if ('$value' in element) {
            value = getValue(element);
        } else if (type === 'select-multiple') {
            value = [];
            for (const option of element.selectedOptions) {
                value.push(getValue(option));
            }
        } else if (type === 'select-one') {
            const [ option ] = element.selectedOptions;
            value = getValue(option);
        } else {
            value = element.value;
        }

        let data = form;
        name.split(/\s*\.\s*/).forEach((part, index, parts) => {
            const next = parts[ index + 1 ];
            if (next) {
                if (!data[ part ]) {
                    data[ part ] = /[0-9]+/.test(next) ? [] : {};
                }
                data = data[ part ];
            } else {
                data[ part ] = value;
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
    const elements = target?.elements || target?.form?.elements;

    for (const element of elements) {
        const { type, nodeName } = element;

        if (
            (!type && nodeName !== 'TEXTAREA') ||
            type === 'submit' || type === 'button' || !type
        ) continue;

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

    await binder.compute({ event });

    return false;
};

const on = async function on (binder) {

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

export default on;
