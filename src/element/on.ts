import Binder from './binder.ts';

interface Target extends HTMLElement {
    form: HTMLFormElement;
}

interface Child extends HTMLElement {
    type: string;
    name: string;
    value: string;
    $value: unknown;
    checked: boolean;
    valueAsNumber: number;
    selectedIndex: number;
    selectedOptions: NodeListOf<Child>;
}

const Value = function (element: Child) {
    if (!element) return undefined;
    if ('$value' in element) return element.$value ? JSON.parse(JSON.stringify(element.$value)) : element.$value;
    if (element.type === 'number' || element.type === 'range') return element.valueAsNumber;
    return element.value;
};

const submit = async function (event: Event, binder: Binder) {
    event.preventDefault();

    const form: Record<string, any> = {};
    const target = (event.target as Target)?.form || event.target as HTMLFormElement;
    const elements: NodeListOf<Child> = target?.querySelectorAll('[name]');

    for (const element of elements) {
        const { type, name, checked } = element;

        if (!name) continue;
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
        const parts = name.split(/\s*\.\s*/);
        for (let index = 0; index < parts.length; index++) {
            const part = parts[ index ];
            const next = parts[ index + 1 ];
            if (next) {
                if (!data[ part ]) {
                    data[ part ] = /[0-9]+/.test(next) ? [] : {};
                }
                data = data[ part ];
            } else {
                data[ part ] = value;
            }
        }

    }

    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$form = form;
    await binder.compute();

    if (target.hasAttribute('reset')) {
        for (const element of elements) {
            const { type, name } = element;
            if (!name) continue;
            else if (type === 'submit' || type === 'button') continue;
            else if (type === 'select-one') element.selectedIndex = 0;
            else if (type === 'select-multiple') element.selectedIndex = -1;
            else if (type === 'radio' || type === 'checkbox') element.checked = false;
            else element.value = '';
            element.dispatchEvent(new Event('input'));
        }
    }

    return false;
};

const reset = async function (event: Event, binder: Binder) {
    event.preventDefault();

    const target = (event.target as Target)?.form || event.target as HTMLFormElement;
    const elements: NodeListOf<Child> = target?.querySelectorAll('[name]');

    for (const element of elements) {
        const { type, name } = element;
        if (!name) continue;
        else if (type === 'submit' || type === 'button') continue;
        else if (type === 'select-one') element.selectedIndex = 0;
        else if (type === 'select-multiple') element.selectedIndex = -1;
        else if (type === 'radio' || type === 'checkbox') element.checked = false;
        else element.value = '';
        element.dispatchEvent(new Event('input'));
    }

    binder.instance.event = event;
    binder.instance.$event = event;
    await binder.compute();

    return false;
};

export default class On extends Binder {

    render () {
        (this.owner as any)[ this.name ] = undefined;
        const name = this.name.slice(2);

        if (this.meta.method) {
            this.owner?.removeEventListener(name, this.meta.method);
        }

        this.meta.method = (event: Event) => {
            if (name === 'reset') {
                return reset(event, this);
            } else if (name === 'submit') {
                return submit(event, this);
            } else {
                this.instance.event = event;
                this.instance.$event = event;
                return this.compute();
            }
        };

        this.owner?.addEventListener(name, this.meta.method);
    }

    reset () {
        (this.owner as any)[ this.name ] = null;
        const name = this.name.slice(2);

        if (this.meta.method) {
            this.owner?.removeEventListener(name, this.meta.method);
        }

    }

}
