
type FormChild = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const Value = function (element: any) {
    if (!element) return undefined;
    else if ('$value' in element) return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
    else if (element.type === 'number' || element.type === 'range') return element.valueAsNumber;
    else return element.value;
};

const submit = function (event: Event, binder: any) {
    event.preventDefault();

    const form: any = {};
    const target: any = event.target;
    const elements: NodeListOf<any> = ((target as HTMLInputElement)?.form || target)?.querySelectorAll('[name]');

    for (const element of elements) {
        const { type, name, checked, hidden } = element;

        if (!name) continue;
        if (hidden) continue;
        if (type === 'radio' && !checked) continue;
        if (type === 'submit' || type === 'button') continue;

        let value: string | string[];
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
        name.split(/\s*\.\s*/).forEach((part: string, index: number, parts: []) => {
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

    binder.compute({ $form: form, $event: event });
    if (target.getAttribute('reset')) target.reset();

    return false;
};

const reset = function (event: Event, binder: any) {
    event.preventDefault();

    const target = (event.target as Element);
    const elements: NodeListOf<any> = ((target as HTMLInputElement)?.form || target)?.querySelectorAll('[name]');

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

    binder.compute({ $event: event });

    return false;
};

const onRender = function (binder: any) {
    binder.owner[ binder.name ] = null;
    const name = binder.name.slice(2);

    if (!binder.meta.setup) {
        binder.meta.setup = true;
        binder.node.value = '';
    }

    if (binder.meta.method) {
        binder.owner.removeEventListener(name, binder.meta.method);
    }

    binder.meta.method = (event: Event) => {
        if (name === 'reset') {
            return reset(event, binder);
        } else if (name === 'submit') {
            return submit(event, binder);
        } else {
            return binder.compute({ $event: event });
        }
    };

    binder.owner.addEventListener(name, binder.meta.method);
};

const onUnrender = function (binder: any) {
    binder.owner[ binder.name ] = null;
    const name = binder.name.slice(2);

    if (binder.meta.method) {
        binder.owner.removeEventListener(name, binder.meta.method);
    }

};

export default { render: onRender, unrender: onUnrender };
