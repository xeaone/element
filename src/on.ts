import utility from './utility';

interface Target extends HTMLElement {
    form: HTMLFormElement;
}

interface Child extends HTMLElement {
    type: string;
    name: string;
    value: string;
    checked: boolean;
    valueAsNumber: number;
    selectedIndex: number;
    selectedOptions: NodeListOf<Child>;
    [ key: symbol ]: any;
}

const onValue = function (element: Child) {
    if (!element) return undefined;

    if (utility.value in element) {
        return utility.parseable(element[ utility.value ]) ?
            JSON.parse(JSON.stringify(element[ utility.value ])) :
            element[ utility.value ];
    }

    if (element.type === 'number' || element.type === 'range') {
        return element.valueAsNumber;
    }

    return element.value;
};

const onSubmit = async function (event: Event, binder: any) {
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
                value.push(onValue(option));
            }
        } else if (type === 'select-one') {
            const [ option ] = element.selectedOptions;
            value = onValue(option);
        } else {
            value = onValue(element);
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

const onReset = async function (event: Event, binder: any) {
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

export default {

    setup (binder: any) {
        binder.owner[ binder.name ] = undefined;
        binder.meta.name = binder.name.slice(2);
    },

    async render (binder: any) {

        if (binder.meta.method) {
            binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
        }

        binder.meta.method = (event: Event) => {
            if (binder.meta.name === 'reset') {
                return onReset(event, binder);
            } else if (binder.meta.name === 'submit') {
                return onSubmit(event, binder);
            } else {
                binder.instance.event = event;
                binder.instance.$event = event;
                return binder.compute();
            }
        };

        binder.owner.addEventListener(binder.meta.name, binder.meta.method);
    },

    async reset (binder: any) {

        if (binder.meta.method) {
            binder.owner.removeEventListener(binder.meta.name, binder.meta.method);
        }

    }

};
