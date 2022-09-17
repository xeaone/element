import tool from './tool.ts';
import date from './date.ts';
import { BinderType } from './types.ts';

type valueElement = HTMLElement & HTMLInputElement & HTMLOptionElement & HTMLSelectElement & Record<symbol, any>;

const valueEvent = new Event('input');

const valueInput = async function (binder: BinderType, event: InputEvent) {
    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$assign = true;

    const owner = binder.owner as valueElement;

    if (owner.type === 'select-one') {
        const option = owner.selectedOptions[0] as valueElement;
        if (option) {
            if (tool.value in option) {
                binder.instance.$value = option[tool.value];
            } else {
                binder.instance.$value = option.value;
            }
        } else {
            binder.instance.$value = undefined;
        }
    } else if (owner.type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(
            owner.selectedOptions,
            (option) => tool.value in option ? option[tool.value] : option.value,
        );
    } else if (owner.type === 'number' || owner.type === 'range' || date.includes(owner.type)) {
        if (tool.value in binder.owner && typeof owner[tool.value] === 'number') {
            binder.instance.$value = owner.valueAsNumber;
        } else {
            binder.instance.$value = owner.value;
        }
    } else if (owner.nodeName == 'OPTION') {
        throw 'option event';
    } else {
        if (tool.value in binder.owner && tool.parseable(owner[tool.value])) {
            binder.instance.$value = JSON.parse(owner.value);
        } else {
            binder.instance.$value = owner.value;
        }
        // if (owner.type === 'checkbox' || owner.type === 'radio') {
        //     binder.instance.$checked = owner.checked;
        // }
    }

    owner[tool.value] = await binder.compute();
};

const valueSetup = function (binder: BinderType) {
    binder.owner.addEventListener('input', (event: InputEvent) => valueInput(binder, event));
};

const valueRender = async function (binder: BinderType) {
    binder.instance.$assign = false;
    binder.instance.event = undefined;
    binder.instance.$event = undefined;
    binder.instance.$value = undefined;

    const computed = await binder.compute();
    const owner = binder.owner as valueElement;

    owner.value = '';

    let display;

    if (owner.type === 'select-one') {
        for (let i = 0; i < owner.options.length; i++) {
            const option = owner.options[i] as valueElement;
            option.selected = tool.value in option ? option[tool.value] === computed : option.value === computed;
        }

        if (computed === undefined && owner.options.length && !owner.selectedOptions.length) {
            owner.options[0].selected = true;
            return owner.dispatchEvent(valueEvent);
        }

        display = tool.display(computed);
    } else if (owner.type === 'select-multiple') {
        for (let i = 0; i < owner.options.length; i++) {
            const option = owner.options[i] as valueElement;
            option.selected = computed?.includes(tool.value in option ? option[tool.value] : option.value);
        }

        display = tool.display(computed);
    } else if (owner.type === 'number' || owner.type === 'range' || date.includes(owner.type)) {
        if (typeof computed === 'string') owner.value = computed;
        else if (typeof computed === 'number' && !isNaN(computed)) owner.valueAsNumber = computed;
        else owner.value = '';
        display = owner.value;
    } else {
        if (owner.nodeName == 'OPTION') {
            const parent = owner?.parentElement?.nodeName === 'SELECT'
                ? owner.parentElement
                : owner?.parentElement?.parentElement?.nodeName === 'SELECT'
                ? owner.parentElement.parentElement
                : owner?.[tool.parent]?.nodeName === 'SELECT'
                ? owner[tool.parent]
                : null;

            const value = tool.value in parent ? parent[tool.value] : parent.value;

            if (value === computed) owner.selected = true;
        }

        display = tool.display(computed);
        owner.value = display;
    }

    owner[tool.value] = computed;
    owner.setAttribute('value', display);
};

const valueReset = function (binder: BinderType) {
    const owner = binder.owner as HTMLElement & HTMLInputElement & HTMLSelectElement & Record<symbol, any>;

    if (owner.type === 'select-one' || owner.type === 'select-multiple') {
        for (const option of owner.options) {
            option.selected = false;
        }
    }

    owner.value = '';
    owner.setAttribute('value', '');
    owner[tool.value] = undefined;
};

const valueDefault = { setup: valueSetup, render: valueRender, reset: valueReset };

export default valueDefault;
