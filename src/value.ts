import tool from './tool.ts';
import date from './date.ts';
import { BinderType } from './types.ts';

type valueElement = HTMLElement & HTMLInputElement & HTMLOptionElement & HTMLSelectElement & Record<symbol, any>;

const valueEvent = new Event('input');

const valueInput = async function (binder: BinderType, event: Event) {
    if (binder.meta.busy) return;

    binder.meta.busy = true;
    binder.instance.event = event;

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
    const type = binder.owner.type;

    if (type === 'select-one') {
        const option = binder.owner.selectedOptions[0];
        if (option) {
            if (option.x.value) {
                binder.instance.$value = option.x.value.meta.value;
            } else {
                binder.instance.$value = option.value;
            }
        } else {
            binder.instance.$value = undefined;
        }
    } else if (type === 'select-multiple') {
        binder.instance.$value = Array.prototype.map.call(
            binder.owner.selectedOptions,
            (option) => option.x ? option.x.value.meta.value : option.value,
        );
    } else if (type === 'number' || type === 'range' || date.includes(type)) {
        if (typeof binder.meta.value === 'number') {
            binder.instance.$value = binder.owner.valueAsNumber;
        } else {
            binder.instance.$value = binder.owner.value;
        }
    } else if (binder.owner.nodeName == 'OPTION') {
        throw 'option event';
    } else {
        if (tool.parseable(binder.meta.value)) {
            binder.instance.$value = JSON.parse(binder.owner.value);
        } else {
            // if (event.data) binder.meta.value += event.data;
            // else binder.meta.value = '';
            // console.log(binder.meta.value);
            binder.instance.$value = binder.owner.value;
        }
        // if (type === 'checkbox' || type === 'radio') {
        // binder.instance.$checked = owner.checked;
        // }
    }

    const computed = await binder.compute();
    const display = tool.display(computed);

    binder.meta.busy = false;
    binder.meta.value = computed;
    binder.owner.value = display;
    binder.instance.event = undefined;
    binder.owner.setAttribute('value', display);
};

const valueSetup = function (binder: BinderType) {
    binder.meta.value = undefined;
    // binder.owner.value = '';
    // binder.owner.addEventListener('beforeinput', (event: InputEvent) => valueInput(binder, event));

    // Object.defineProperties(binder.instance, {
    //     $value: {
    //         get() {
    //             return binder.owner.value;
    //         },
    //         set(value) {
    //             binder.owner.value = value;
    //         },
    //     },
    // });

    binder.owner.addEventListener('input', (event: Event) => valueInput(binder, event));
};

const valueRender = async function (binder: BinderType) {
    if (binder.meta.busy) return;

    binder.meta.busy = true;
    binder.instance.event = undefined;

    const computed = await binder.compute();

    let display;

    if (binder.owner.type === 'select-one') {
        for (let i = 0; i < binder.owner.options.length; i++) {
            const option = binder.owner.options[i];
            option.selected = option.x.value ? option.x.value.meta.value === computed : option.value === computed;
        }

        if (computed === undefined && binder.owner.options.length && !binder.owner.selectedOptions.length) {
            binder.owner.options[0].selected = true;
            binder.owner.dispatchEvent(valueEvent);
            return;
        }

        display = tool.display(computed);
    } else if (binder.owner.type === 'select-multiple') {
        for (let i = 0; i < binder.owner.options.length; i++) {
            const option = binder.owner.options[i];
            option.selected = computed?.includes(option.x ? option.x.value.meta.value : option.value);
        }

        display = tool.display(computed);
    } else if (binder.owner.type === 'number' || binder.owner.type === 'range' || date.includes(binder.owner.type)) {
        if (typeof computed === 'string') binder.owner.value = computed;
        else if (typeof computed === 'number' && !isNaN(computed)) binder.owner.valueAsNumber = computed;
        else binder.owner.value = '';
        display = binder.owner.value;
    } else {
        display = tool.display(computed);
        binder.owner.value = display;
    }

    binder.meta.busy = false;
    binder.meta.value = computed;
    // binder.owner.value = display;
    binder.instance.event = undefined;
    binder.owner.setAttribute('value', display);
};

const valueReset = function (binder: BinderType) {
    if (binder.meta.busy) return;

    binder.meta.busy = true;

    if (binder.owner.type === 'select-one' || binder.owner.type === 'select-multiple') {
        for (const option of binder.owner.options) {
            option.selected = false;
        }
    }

    binder.meta.busy = false;
    binder.owner.value = null;
    binder.meta.value = undefined;
    binder.owner.setAttribute('value', '');
};

const valueDefault = { setup: valueSetup, render: valueRender, reset: valueReset };

export default valueDefault;
