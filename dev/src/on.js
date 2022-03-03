const Value = function (element) {
    if (!element) return undefined;
    else if ('$value' in element) return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
    else if (element.type === 'number' || element.type === 'range') return element.valueAsNumber;
    else return element.value;
};

const submit = function (event, binder) {
    event.preventDefault();

    const form = {};
    const target = event.target;
    // const elements = target?.elements || target?.form?.elements;
    const elements = (target?.form || target)?.querySelectorAll('[name]');

    for (const element of elements) {
        const { type, name, checked, hidden } = element;

        if (!name) continue;
        if (hidden) continue;
        if (type === 'radio' && !checked) continue;
        if (type === 'submit' || type === 'button') continue;

        let value;
        if (type === 'select-multiple') {
            value = [];
            for (const option of element.selectedOptions) {
                value.push(Value(option));
            }
        } else if (type === 'select-one') {
            const [ option ] = element.selectedOptions;
            value = Value(option);
        } else {
            value = Value(element);
        }

        let data = form;
        name.split(/\s*\.\s*/).forEach(function (part, index, parts) {
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

    binder.alias.$form = form;
    binder.alias.$event = event;
    binder.compute();

    if (target.getAttribute('reset')) target.reset();

    return false;
};

const reset = function (event, binder) {
    event.preventDefault();

    const target = event.target;
    // const elements = target?.elements || target?.form?.elements;
    const elements = (target?.form || target)?.querySelectorAll('[name]');

    for (const element of elements) {
        const { type, name, checked, hidden, nodeName } = element;

        if (!name) continue;
        if (hidden) continue;
        if (type === 'radio' && !checked) continue;
        if (type === 'submit' || type === 'button') continue;

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

    binder.alias.$event = event;
    binder.compute();

    return false;
};

const onRender = async function (binder) {
    binder.node[ binder.name ] = null;
    const name = binder.name.slice(2);

    if (binder.method) {
        binder.node.removeEventListener(name, binder.method);
    }

    binder.method = function (event) {
        if (name === 'reset') {
            return reset(event, binder);
        } else if (name === 'submit') {
            return submit(event, binder);
        } else {
            binder.alias.$event = event;
            return binder.compute();
        }
    };

    binder.node.addEventListener(name, binder.method);
};

const onDerender = async function (binder) {
    binder.node[ binder.name ] = null;
    const name = binder.name.slice(2);

    if (binder.method) {
        binder.node.removeEventListener(name, binder.method);
    }

};

export default { render: onRender, derender: onDerender };