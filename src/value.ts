import tool from './tool.ts';
import date from './date.ts';
import { BinderType } from './types.ts';

const valueEvent = new Event('input');

const valueInput = async function (binder: BinderType, event: Event) {
    const { owner, instance } = binder;

    let value;
    const type = binder.meta.type;

    if (type === 'select-one') {
        value = undefined;
        const option = owner.selectedOptions[0];
        if (option?.x?.value) {
            await option.x.value.promise;
            value = option.x.value.instance.$value;
        } else if (option) {
            value = option.value;
        }
    } else if (type === 'select-multiple') {
        value = [];
        for (const option of owner.selectedOptions) {
            if (option?.x?.value) {
                await option.x.value.promise;
                value?.push?.(option.x.value.instance.$value);
            } else {
                value?.push?.(option.value);
            }
        }
    } else if (type === 'number' || type === 'range' || date.includes(type)) {
        if (typeof instance.$value === 'number') {
            value = owner.valueAsNumber;
        } else {
            value = owner.value;
        }
    } else {
        value = owner.value;
    }

    instance.$value = value;
    instance.$event = event;
    instance.event = event;
    value = await binder.compute();
    instance.$value = value;
    instance.event = undefined;
    instance.$event = undefined;

    owner.setAttribute('value', JSON.stringify(value));
};

const valueSetup = function (binder: BinderType) {
    binder.owner.value = '';
    binder.instance.$value = undefined;
    binder.meta.type = binder.owner.type;
    binder.owner.addEventListener('input', (event: Event) => valueInput(binder, event));
};

const valueRender = async function (binder: BinderType) {
    const { owner, instance } = binder;

    instance.event = undefined;
    instance.$value = undefined;
    instance.$event = undefined;
    const value = await binder.compute();
    instance.$value = value;
    instance.event = undefined;
    instance.$event = undefined;

    const type = binder.meta.type;

    if (type === 'select-one') {
        await owner?.x?.each?.promise;
        for (let i = 0; i < owner.options.length; i++) {
            const option = owner.options[i];
            if (option?.x?.value) {
                await option.x.value.promise;
                option.selected = option.x.value.instance.$value === value;
            } else {
                option.selected = option.value === value;
            }
        }

        if (value === undefined && owner.options.length && !owner.selectedOptions.length) {
            owner.options[0].selected = true;
            owner.dispatchEvent(valueEvent);
            return;
        }
    } else if (type === 'select-multiple') {
        await owner?.x?.each?.promise;
        for (let i = 0; i < owner.options.length; i++) {
            const option = owner.options[i];
            if (option?.x?.value) {
                await option.x.value.promise;
                option.selected = value?.includes(option.x.value.instance.$value);
            } else {
                option.selected = value?.includes(option.value);
            }
        }
    } else if (type === 'number' || type === 'range' || date.includes(type)) {
        if (typeof value === 'string') owner.value = value;
        else if (typeof value === 'number') owner.valueAsNumber = value || 0;
        else owner.value = undefined;
    } else {
        owner.value = value ?? '';
    }

    owner.setAttribute('value', tool.display(value));
};

const valueReset = function (binder: BinderType) {
    const type = binder.meta.type;
    const { owner, instance } = binder;

    if (type === 'select-one' || type === 'select-multiple') {
        for (const option of owner.options) {
            option.selected = false;
        }
    }

    owner.value = null;
    instance.event = undefined;
    instance.$event = undefined;
    instance.$value = undefined;
    owner.setAttribute('value', '');
};

const valueDefault = { setup: valueSetup, render: valueRender, reset: valueReset };

export default valueDefault;
