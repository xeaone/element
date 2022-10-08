import tool from './tool.ts';
import date from './date.ts';
import { BinderType } from './types.ts';

type valueElement = HTMLElement & HTMLInputElement & HTMLOptionElement & HTMLSelectElement & Record<symbol, any>;

const valueEvent = new Event('input');

const valueInput = async function (binder: BinderType, event: InputEvent) {
    console.log('valueInput');
    if (binder.meta.busy) return;
    else binder.meta.busy = true;

    binder.instance.event = event;
    binder.instance.$event = event;
    binder.instance.$render = false;

    // console.log(event.inputType, event.isComposing, event.dataTransfer, event.data);

    // const data = event.data;
    // const { value, selectionStart, selectionEnd } = (event.target as any);

    // console.log(
    //     binder.owner.value,
    //     selectionStart,
    //     selectionEnd,
    //     value.substring(0, (event.target as any).selectionStart),
    //     event.data,
    //     value.substring((event.target as any).selectionEnd),
    // );

    // binder.meta.value = value.substring(0, selectionStart) + (data ?? '') + value.substring(selectionEnd);
    // console.log(next);
    // const next = value;

    // const data = event.data;
    // const value = event.data ?? '';
    // const value = event.data ?? binder.owner.value;
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
            if (event.data) binder.meta.value += event.data;
            else binder.meta.value = '';
            console.log(binder.meta.value);

            binder.instance.$value = owner.value;
        }
        if (owner.type === 'checkbox' || owner.type === 'radio') {
            binder.instance.$checked = owner.checked;
        }
    }

    const computed = await binder.compute();
    const display = tool.display(computed);

    // owner[tool.value] = computed;

    owner.value = display;
    owner.setAttribute('value', display);
    binder.meta.busy = false;
};

const valueSetup = function (binder: BinderType) {
    binder.owner.value = '';
    // binder.owner.addEventListener('beforeinput', (event: InputEvent) => valueInput(binder, event));
    Object.defineProperties(binder.instance, {
        $value: {
            get() {
                return binder.owner.value;
            },
            set(value) {
                binder.owner.value = value;
            },
        },
    });
    binder.owner.addEventListener('input', (event: InputEvent) => valueInput(binder, event));
};

const valueRender = async function (binder: BinderType) {
    console.log('valueRender', binder.meta.busy);
    if (binder.meta.busy) return;
    else binder.meta.busy = true;

    binder.instance.$render = true;
    binder.instance.event = undefined;
    binder.instance.$event = undefined;

    const owner = binder.owner as valueElement;
    const computed = await binder.compute();

    // owner[tool.value] = owner.value;

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
        display = tool.display(computed);
        owner.value = display;
    }

    // owner[tool.value] = computed;
    owner.setAttribute('value', display);
    binder.meta.busy = false;
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
